const util = require('util')
const Promise = require('bluebird')
const path = require('path')
const exec = util.promisify(require('child_process').exec)
const execSync = require('child_process').execSync
const spawn = require('child_process').spawn
const archiver = require('archiver')
const extract = require('extract-zip')
const fs = require('fs')
// Also include fs-extra, because there is no convenient API for removing dirs in fs
const fse = require('fs-extra')
const os = require('os')
const uuid = require('uuid')
const dbapi = require('../../db/api')

const STD_MAX_LENGTH = 4000
const MAX_BUFFER = 1024 * 1000
const LARGE_TIMEOUT = 30 * 60 * 1000
const SMALL_TIMEOUT = 2 * 60 * 1000

const ADB_PATH_HOST = '/opt/Android/Sdk/platform-tools/adb'
const APK_FOLDER_CONTAINER = '/root/apks'
const TOOL_OUTPUT_FOLDER = '/root/output'

function assert(condition, message) {
  if (!condition) {
    throw message || "Assertion failed"
  }
}

function truncate(msg) {
  const str = String(msg)
  if (str.length > STD_MAX_LENGTH) {
    return str.substring(0, STD_MAX_LENGTH) + "..."
  } else {
    return str
  }
}

function getTmpDir(storageDir) {
  const id = uuid.v4()

  let newDir = path.join(storageDir, id)
  fs.mkdirSync(newDir)

  return newDir
}

class TestExecutor {

  constructor(socket, log, email, storageDir) {
    this.socket = socket
    this.log = log
    this.email = email
    this.storageDir = storageDir
  }

  async executeTests(tests, storageId) {
    this.log.info('Tests: ', tests)

    this.devices = tests.devices
    this.numberOfRetriesOnFailure = tests.numberOfRetriesOnFailure
    this.storageId = storageId

    const apkDir = path.join(this.storageDir, storageId)
    const promises = []
    const testsOutputDir = path.join(apkDir, 'output')
    const self = this

    try {
      this.submitJob(tests).then(function() {
        // TODO send a message with 'Your job was submitted with the id ...'
      })

      // Unzip apks if a .zip was provided
      await this.unzipApksIfExisting(apkDir, apkDir)
      this.log.info('Directory containing apk(s): ' + apkDir)

      // Build the docker container
      const imageTag = `${tests.config.title}:latest`
      const dockerDir = getTmpDir(this.storageDir)
      await this.buildDockerContainer(dockerDir, tests.config, imageTag)

      tests.runs.forEach(function(test) {
        self.log.info('Test run with config name: ' + tests.config.title)

        test.outputDir = path.join(testsOutputDir, `out_${test.id}`)
        fs.mkdirSync(test.outputDir)
        promises.push(self.execute(test, tests.config, apkDir, imageTag))
      })

      Promise.all(promises).then(function () {
        // Zip output and reports
        const zipPath = path.join(apkDir, '/output.zip')
        const zipFile = fs.createWriteStream(zipPath)
        const archive = archiver('zip')
        // Pipe archive data to the file
        archive.pipe(zipFile)
        archive.directory(testsOutputDir, path.basename(testsOutputDir))
        archive.finalize()

        self.updateJobStatus('Finished', '').then(function () {
          self.log.info("Test execution done.")
        })

      }).catch(function (err) {
        console.log(err)
        self.handleExecutionError(tests.runs, err)
      })
    } catch (err) {
      await self.handleExecutionError(tests.runs, err)
    }

  }

  /**
   * Handles errors which abort the overall execution process, not for single test runs.
   * It notifies each test run.
   */
  async handleExecutionError(testRuns, err) {
    await this.submitJobFailure(err)
    const self = this
    testRuns.forEach(function(test) {
      self.reportStderr('Test run aborted.', test.id)
      self.reportFinished('Test run aborted.', test.id)
    })
  }

  async acquireDevice() {
    const self = this
    return new Promise(function (resolve, reject) {
      (function waitForAvailableDevice() {

        if (self.devices.length > 0) {
          let dev = self.devices.pop()
          return resolve(dev)
        }
        setTimeout(waitForAvailableDevice, 700)
      })()
    })
  }

  releaseDevice(device) {
    this.devices.push(device)
  }

  async execute(test, testConfig, apkDir, imageTag) {
    try {
      // Create the docker container
      const {device: device, containerId: containerId} = await this.createDockerContainer(imageTag, test, testConfig)
      this.updateUserJobUsedContainer(containerId)

      // Prepare the docker container
      fs.readdirSync(apkDir).forEach(file => {
        // Only copy .apk files
        if (path.extname(file) === '.apk') {
          this.copyFileFromHostToDockerContainer(path.join(apkDir, file), containerId, APK_FOLDER_CONTAINER)
        }
      })

      // Start the docker container
      await this.startDockerContainer(containerId, test)
      this.log.info(`Container ${containerId} finished. Release device: ${device.serial}.`)
      this.releaseDevice(device)
      this.copyFileFromDockerContainerToHost(TOOL_OUTPUT_FOLDER, containerId, test.outputDir)
    } catch (error) {
      // TODO think about handling the error e.g. release device and stop the container etc.
      const errorStr = truncate(JSON.stringify(error, Object.getOwnPropertyNames(error)))
      this.log.warn(errorStr)
      this.socket.emit('command.testing.tools.error', {
        id: test.id,
        message: errorStr
      })
      this.updateUserJobRunFailure(false)
    }

    this.reportFinished('Test terminated.', test.id)
  }

  /**
   * Docker ref: https://docs.docker.com/engine/reference/commandline/build/
   */
  async buildDockerContainer(dockerDir, testConfig, imageTag) {
    const cmd = `cd ${dockerDir}; ` +
                `docker build ` +
                `--build-arg TOOL_COMMIT_DEF=${testConfig.gitCommit} ` +
                `--build-arg GIT_REPOSITORY=${testConfig.gitRepository} ` +
                `--build-arg TOOL_FOLDERNAME=${testConfig.title} ` +
                `--build-arg SETUP_PARAMETERS="[ ${testConfig.setupParameters} ]" ` +
                `-q -t "${imageTag}" ${testConfig.dockerRepository}`
    let error = null
    let stdout = ''
    let stderr = ''

    try {
      this.log.info(cmd)
      const {_error, _stdout, _stderr} = await exec(cmd, {maxBuffer: MAX_BUFFER, timeout: LARGE_TIMEOUT})
      error = _error
      stdout = _stdout
      stderr = _stderr
    } catch (_error) {
      error = _error
    }

    if (error) {
      throw error
    }

  }

  /**
   * Creates a docker container based on the passed dockerImage and params and
   * returns the container id.
   *
   * Docker ref: https://docs.docker.com/engine/reference/commandline/create/
   */
  async createDockerContainer(dockerImage, test, testConfig) {
    // TODO check commands --net ...
    const device = await this.acquireDevice()
    const cmd = `docker create --net=host ` +
                `-v ${ADB_PATH_HOST}:/usr/local/bin/adb ${dockerImage} ` +
                `${device.serial} ` +
                `${testConfig.toolParameters}`
    this.log.info(cmd)
    try {
      const stdoutObj = execSync(cmd, {maxBuffer: MAX_BUFFER, timeout: SMALL_TIMEOUT})
      const stdout = String(stdoutObj).trim()

      if (stdout === '') {
        throw Error('Creating Docker container failed with empty stdout.')
      }

      this.log.info('Creating Docker container finished with stdout: ' + stdout)

      return {device: device, containerId: stdout}
    } catch (error) {
      console.log(error)
      console.log(error.stdout)
      console.log(error.stderr)
      console.log(error)
      throw error
    }
  }

  /**
   * Docker ref: https://docs.docker.com/engine/reference/commandline/cp/
   */
  copyFileFromHostToDockerContainer(fileHost, containerId, destContainer) {
    const cmd = `docker cp ${fileHost} ${containerId}:${destContainer}`
    this.log.info(cmd)
    const stdoutObj = execSync(cmd, {maxBuffer: MAX_BUFFER, timeout: SMALL_TIMEOUT})
    const stdout = String(stdoutObj).trim()

    return stdout
  }

  /**
   * Docker ref: https://docs.docker.com/engine/reference/commandline/cp/
   */
  copyFileFromDockerContainerToHost(fileContainer, containerId, destHost) {
    const cmd = `docker cp ${containerId}:${fileContainer} ${destHost}`
    this.log.info(cmd)
    const stdoutObj = execSync(cmd, {maxBuffer: MAX_BUFFER, timeout: SMALL_TIMEOUT})
    const stdout = String(stdoutObj).trim()

    return stdout
  }

  /**
   * Docker ref: https://docs.docker.com/engine/reference/commandline/start/
   */
  async startDockerContainer(containerId, test) {
    // Consider --rm
    const cmd = `docker start -a ${containerId}`
    // const cmd = `docker start -a ${containerId} &> docker.log`
    let error = null
    let exitCode = null

    try {
      this.log.info(cmd)

      // Use spawnSync here, because exec returned earlier from the process though the container was still running.
      // This happened with DroidMate and multiple apks.
      const {error: _error, exitCode: _exitCode} = await this.spawnProcess(cmd, {shell: true}, test.id)
      error = _error
      exitCode = _exitCode

      // console.log('error: ' + error)
      // console.log('stdout: ' + stdout)
      // console.log('stderr: ' + stderr)
    } catch (_error) {
      error = _error
    }

    // Error happened
    if (error) {
      if (this.numberOfRetriesOnFailure > 0) {
        this.numberOfRetriesOnFailure--
        this.log.warn(`Docker start failed. Try it once more. Remaining retries: ${this.numberOfRetriesOnFailure}`)
        this.updateUserJobRunFailure(true)
        await this.startDockerContainer(containerId, test)
      } else {
        let errorStr = JSON.stringify(error, Object.getOwnPropertyNames(error))
        const errorTruncated = 'The execution was not successful: ' + truncate(errorStr)
        this.log.warn('errorTruncated: ' + errorTruncated)
        this.socket.emit('command.testing.tools.error', {
          id: test.id,
          message: errorTruncated
        })
        this.updateUserJobRunFailure(false)
      }
    } else {
      this.updateUserJobRunSuccess()
    }

  }

  spawnProcess(cmd, options, id) {
    const resolver = Promise.defer()
    const child = spawn(cmd, options)
    let error = null
    let stdoutCounter = 0
    let stderrCounter = 0

    child.stdout.on('data', (data) => {
      let stdout = String(data)
      stdoutCounter =+ stdout.length
      if (stdoutCounter <= STD_MAX_LENGTH) {
        this.reportStdout(stdout, id)
      }
    })

    child.stderr.on('data', (data) => {
      let stderr = String(data)
      stderrCounter += stderr.length
      if (stderrCounter <= STD_MAX_LENGTH) {
        this.reportStderr(stderr, id)
      }
    })

    child.on('error', data => {
      error = data
    })

    // child.on('close', (code) => {
    //   console.log(`child process exited with code ${code}`)
    //   resolver.resolve({error, stdout, stderr})
    // })

    child.on('exit', code => {
      resolver.resolve({error: error, exitCode: code})
    })

    return resolver.promise
  }

  async submitJob(tests) {
    dbapi.insertUserJob(this.storageId, tests, this.email)
  }

  async submitJobFailure(error) {
    const errorStr = truncate(JSON.stringify(error, Object.getOwnPropertyNames(error)))
    await this.updateJobStatus('Failed', errorStr)
  }

  async updateJobStatus(status, errorMsg) {
    dbapi.updateUserJobStatus(this.storageId, status, errorMsg)
  }

  async updateUserJobRunFailure(retry) {
    dbapi.updateUserJobRuns(this.storageId, false, retry)
  }

  async updateUserJobRunSuccess() {
    dbapi.updateUserJobRuns(this.storageId, true, false)
  }

  async updateUserJobUsedContainer(containerId) {
    dbapi.insertUserJobUsedContainer(this.storageId, containerId)
  }

  /**
   * Unzips a .zip file, if existing in the containingDir to the destDir.
   *
   * We only expect one .zip file.
   */
  unzipApksIfExisting(containingDir, destDir) {
    const resolver = Promise.defer()
    const files = fs.readdirSync(containingDir).filter(file => path.extname(file) === '.zip')
    if (files.length === 0) {
      resolver.resolve()
    } else if (files.length === 1) {
      const file = files[0]
      const zip = path.join(containingDir, file)
      this.log.info('Found file to be unzipped: ' + zip)
      extract(zip, {dir: destDir}, function(err) {
        if (err) {
          resolver.reject(err)
        } else {
          this.log.info('Unzipped ' + zip)
          resolver.resolve()
        }
      })
    } else {
      resolver.reject('Expected 0 or 1 .zip file.')
    }

    return resolver.promise
  }

  reportFinished(msg, id) {
    this.log.info('reportFinished: ' + msg)
    this.socket.emit('command.testing.tools.finished', {
      id: id,
      message: msg
    })
  }

  reportStderr(stderr, id) {
    if (stderr && stderr !== '' && typeof stderr !== 'undefined') {
      this.socket.emit('command.testing.tools.error', {
        id: id,
        message: stderr
      })
    }
  }

  reportStdout(stdout, id) {
    if (stdout && stdout !== '' && typeof stdout !== 'undefined') {
      this.socket.emit('command.testing.tools.message', {
        id: id,
        message: stdout
      })
    }
  }

}

const NUMBER_OF_DAYS_FOR_EXPIRATION = 9

class DockerCleanUpExecutor {

  constructor(log, storageDir) {
    this.log = log
    this.storageDir = storageDir
  }

  async cleanup() {
    const cursor = await dbapi.loadUserJobsByFinishedDate(NUMBER_OF_DAYS_FOR_EXPIRATION)
    const jobs = await cursor.toArray()
    if (jobs.length > 0) {
      const jobIds = jobs.map(job => job.id)
      const containerIdsSet = this.getContainerIds(jobs)
      this.removeDockerContainer(containerIdsSet)
      this.removeFilesFromStorage(jobIds)
      await this.removeDatabaseEntries(jobIds)
    }
  }

  /**
   * Docker ref: https://docs.docker.com/engine/reference/commandline/rm/
   */
  removeDockerContainer(containerIdsSet) {
    assert(containerIdsSet.size > 0, 'Expected at least one Docker container id.')
    const cmd = `docker rm -v ${Array.from(containerIdsSet).join(' ')}`
    this.log.info(cmd)
    const stdoutObj = execSync(cmd, {maxBuffer: MAX_BUFFER, timeout: SMALL_TIMEOUT})
    const stdout = String(stdoutObj).trim()

    return stdout
  }

  async removeDatabaseEntries(jobIds) {
    await dbapi.removeUserJobsById(jobIds)
  }

  removeFilesFromStorage(jobIds) {
    const self = this
    jobIds.forEach(function(jobId) {
      const dir = path.join(self.storageDir, jobId)
      fse.removeSync(dir)
    })
  }

  getContainerIds(jobs) {
    const containerIdsSet = new Set()
    jobs.forEach(function(job) {
      job.containerIds.forEach(function(containerIds) {
        containerIdsSet.add(containerIds)
      })
    })
    return containerIdsSet
  }

}

module.exports.DockerCleanUpExecutor = DockerCleanUpExecutor
module.exports.TestExecutor = TestExecutor
