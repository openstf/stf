var util = require('util')
var CronJob = require('cron').CronJob

var Promise = require('bluebird')
var uuid = require('uuid')

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

var logger = require('../../util/logger')
const dbapi = require('../../db/api')
const request = require('request')
const url = require('url')

const STD_MAX_LENGTH = 4000
const MAX_BUFFER = 1024 * 1000
const LARGE_TIMEOUT = 40 * 60 * 1000
const SMALL_TIMEOUT = 2 * 60 * 1000

// The id/index for the general messages, opposed to test run specific messages,
// e.g. failing Docker container build.
const GENERAL_INFO_ID = -1
// The default name of Docker bridge network used to configure the communication
// between emulator containers and testing containers.
// This could be configured as command line argument.
const DOCKER_NETWORK = 'emulatornetwork'
// The default directory in the container to mount adbkey related files.
// This could be configured as command line argument.
const ANDROID_DIR_CONTAINER = '/root/.android/'

// TODO read in the options from the initial export call
// this would solve when this is refactored into a proper unit
var log = logger.createLogger('testexecutor')


function assert(condition, message) {
  if (!condition) {
    log.error(message)
    throw message || 'Assertion failed'
  }
}

function truncate(msg) {
  const str = String(msg)
  if (str.length > STD_MAX_LENGTH) {
    return str.substring(0, STD_MAX_LENGTH) + '...'
  } else {
    return str
  }
}

/**
 * Transform the error into a string and truncate it if necessary.
 */
function errorToString(error) {
  return truncate(JSON.stringify(error, Object.getOwnPropertyNames(error)))
}

/**
 * Abstract super class of PhysicalDevice and EmulatorDevice.
 */
class BaseDevice {
  constructor(serialnumber) {
    this.serialnumber = serialnumber
    this.connectUrl = null
  }
  async setupDeviceInitially() {
    throw Error('Not implemented')
  }
  async releaseDeviceFinally() {
    throw Error('Not implemented')
  }
  getConnectUrl() {
    return this.connectUrl
  }
  getServerAddress() {
    throw Error('Not implemented')
  }
  getSerialNumber() {
    return this.serialnumber
  }
  isEmulator() {
    throw Error('Not implemented')
  }
}

class PhysicalDevice extends BaseDevice {
  constructor(serial, authToken, restBaseUrl) {
    super(serial)
    this.authToken = authToken
    this.restBaseUrl = restBaseUrl
  }

  /**
   * Request the remote connect url from the REST API.
   *
   * TODO use swagger-client library instead of request, but it somehow did not work.
   */
  async setupDeviceInitially(parent) {
    let resolver = Promise.defer()
    log.info(`Setup physical device (${this.serialnumber}) initially.`)

    const reqUrl = url.resolve(this.restBaseUrl, `/api/v1/user/devices/${this.serialnumber}/remoteConnect`)
    let args = {
      url: reqUrl
      , rejectUnauthorized: false
      , followAllRedirects: true
      , auth: {
        'bearer': this.authToken
      }
    }

    const self = this
    // TODO maybe async
    request.post(args, function(err, res, body) {
      if (err || res.statusCode >= 400) {
        let status = res && res.statusCode
        throw Error(`Requesting remote connect URL failed. URL: ${args.url} error: ${err} status code: ${status}`)
      }
      else {
        let result = JSON.parse(body)
        assert(result.success === true, 'Expected request for remote connect URL to be successful.')
        assert(result.remoteConnectUrl !== '', 'Expected remote connect URL to be not empty.')
        self.connectUrl = result.remoteConnectUrl
        resolver.resolve()
      }
    })

    return resolver.promise
  }
  async releaseDeviceFinally(parent) {
    // Do not release device via API. A user might want to keep owning it.
  }
  getServerAddress() {
    return 'localhost'
  }
  isEmulator() {
    return false
  }
}

class EmulatorDevice extends BaseDevice {
  constructor(systemImage, sdCardSize, startupParameters, emulatorDockerRepository) {
    super('emulator-5554')
    this.systemImage = systemImage
    this.sdCardSize = sdCardSize
    this.startupParameters = startupParameters
    this.emulatorDockerRepository = emulatorDockerRepository
    this.id = uuid.v4()
    // TODO the communication with 'adb connect x' didn't work out for emulators.
    // Therefore, the connect url is not set.
    // this.connectUrl = `emulator${this.id}:5037`
    this.dockerImageTag = `emulator${this.id}`
  }
  async setupDeviceInitially(parent) {
    log.info(`Setup emulator initially.`)

    const buildParameters =
      `--build-arg SYSTEM_IMAGE="${this.systemImage}" ` +
      `--build-arg SD_CARD_SIZE=${this.sdCardSize} ` +
      `--build-arg START_UP_PARAMETERS="${this.startupParameters}"`

    await parent.buildDockerContainer(this.dockerImageTag, this.emulatorDockerRepository, buildParameters)

    // Run container with:
    // -dt: detached mode to return from the run call
    // --privileged: privileged mode for necessary virtualization access, see https://github.com/thyrlian/AndroidSDK/
    // --rm: remove the container after it stopped
    // --network: set the network for the communication with testing containers
    // --name: name the container so that the testing container can communicate via the name, Docker will resolve the
    // name, because of the passed network
    const runParameters = `-dt --privileged --network ${DOCKER_NETWORK} --rm --name ${this.dockerImageTag}`
    await parent.runDockerContainer(this.dockerImageTag, runParameters, GENERAL_INFO_ID, true)
  }
  async releaseDeviceFinally(parent) {
    const stopParameters = '--time 5'
    await parent.stopDockerContainer(this.dockerImageTag, stopParameters)
  }
  getServerAddress() {
    return this.dockerImageTag
  }
  isEmulator() {
    return true
  }
}

class TestExecutor {

  constructor(socket, email, options) {
    this.socket = socket
    this.email = email
    this.options = options
  }

  async executeTests(tests, storageId) {
    log.info('Tests: ', tests)

    this.devices = []
    this.numberOfRetriesOnFailure = tests.numberOfRetriesOnFailure
    this.apkSubmitted = !!storageId
    if (this.apkSubmitted) {
      this.storageId = storageId
    } else {
      this.storageId = uuid.v4()
      fs.mkdirSync(path.join(this.options.saveDir, this.storageId))
    }
    const apkDir = path.join(this.options.saveDir, this.storageId)
    const testsOutputDir = path.join(apkDir, 'output')
    // Create output folder for logs and reports
    fs.mkdirSync(testsOutputDir)

    const runPromises = []
    const self = this

    try {
      this.submitJob(tests).then(function() {
        self.reportStdout(`Your job was submitted with id: ${self.storageId}`, GENERAL_INFO_ID)
      })

      // Unzip apks if a .zip was provided
      await this.unzipApksIfExisting(apkDir, apkDir)
      log.info('Directory containing apk(s): ' + apkDir)

      // Build the container
      const imageTag = `${tests.config.title}:latest`
      const buildContainerPromise = this.buildTestContainer(tests.config, imageTag)

      // Push emulators
      tests.emulators.forEach(function (emulatorConfig) {
        assert(emulatorConfig.numberEmulators >= 0, `Number of emulators was: ${emulatorConfig.numberEmulators}`)
        for (let i = 0; i < emulatorConfig.numberEmulators; i++) {
          self.devices.push(
            new EmulatorDevice(
              emulatorConfig.systemImage,
              emulatorConfig.sdCardSize,
              emulatorConfig.startupParameters,
              self.options.emulatorDockerRepository))
        }
      })

      // Push physical devices
      tests.devices.forEach(function (physicalDevice) {
        self.devices.push(new PhysicalDevice(physicalDevice.serial, self.options.authToken, self.options.restUrl))
      })

      // Setup devices + spawn emulators
      const setupDevicePromises = []
      this.devices.forEach(function (device) {
        setupDevicePromises.push(device.setupDeviceInitially(self))
      })

      // Wait for the device setups + building the container
      await buildContainerPromise
      await Promise.all(setupDevicePromises)

      tests.runs.forEach(function(test) {
        log.info('Test run with config name: ' + tests.config.title)

        test.outputDir = path.join(testsOutputDir, `out_${test.id}`)
        fs.mkdirSync(test.outputDir)
        runPromises.push(self.executeTest(test, tests.config, apkDir, imageTag))
      })

      await Promise.all(runPromises)

      // Zip output and reports
      const zipPath = path.join(apkDir, '/output.zip')
      const zipFile = fs.createWriteStream(zipPath)
      const archive = archiver('zip')
      // Pipe archive data to the file
      archive.pipe(zipFile)
      archive.directory(testsOutputDir, path.basename(testsOutputDir))
      archive.finalize()

      await self.updateJobStatus('Finished', '')

      log.info('Test execution done.')
      self.reportStdout('Job finished successfully.', GENERAL_INFO_ID)
    } catch (err) {
      await self.handleExecutionError(tests.runs, err)
    } finally {
      // TODO wait here for all promises (buildContainerPromise, setupDevicePromises, runPromises)
      // TODO stop all containers not just emulators
      const releaseDevicePromises = []
      this.devices.forEach(function (device) {
        releaseDevicePromises.push(device.releaseDeviceFinally(self))
      })

      await Promise.all(releaseDevicePromises)
    }

  }

  /**
   * Handles errors which abort the overall execution process, not for single test runs.
   * It notifies each test run.
   */
  async handleExecutionError(testRuns, error) {
    await this.submitJobFailure(error)

    this.reportStdout(`Job failed:\n${errorToString(error)}`, GENERAL_INFO_ID)
    const self = this
    testRuns.forEach(function(test) {
      self.reportFinished('Test run aborted.', test.id)
    })
  }

  async acquireDevice() {
    const self = this
    return new Promise(function (resolve, reject) {
      (function waitForAvailableDevice() {

        if (self.devices.length > 0) {
          let dev = self.devices.pop()
          log.info('acquireDevice', dev)
          return resolve(dev)
        }
        setTimeout(waitForAvailableDevice, 2000)
      })()
    })
  }

  releaseDevice(device) {
    this.devices.push(device)
  }

  async executeTest(test, testConfig, apkDir, imageTag) {
    try {
      // Create the container
      const {device: device, containerId: containerId} = await this.createTestContainer(imageTag, testConfig)
      this.updateUserJobUsedContainer(containerId)

      // Prepare the container
      fs.readdirSync(apkDir).forEach(file => {
        // Only copy .apk files
        if (path.extname(file) === '.apk') {
          this.copyFileFromHostToDockerContainer(path.join(apkDir, file), containerId, this.options.apkDirContainer)
        }
      })

      // Start the container
      await this.startDockerContainer(containerId, test.id)
      log.info(`Container ${containerId} finished. Release device: ${device.getSerialNumber()}.`)
      this.releaseDevice(device)
      this.copyFileFromDockerContainerToHost(this.options.toolOutputDirContainer, containerId, test.outputDir)
    } catch (error) {
      // TODO think about handling the error e.g. release device and stop the container etc.
      const errorStr = errorToString(error)
      log.warn(errorStr)
      this.socket.emit('command.testing.tools.error', {
        id: test.id,
        message: errorStr
      })
      this.updateUserJobRunFailure(false)
    }

    this.reportFinished('Test terminated.', test.id)
  }

  async buildTestContainer(testConfig, imageTag) {
    const buildParameters =
      `--build-arg TOOL_COMMIT_DEF=${testConfig.gitCommit} ` +
      `--build-arg GIT_REPOSITORY=${testConfig.gitRepository} ` +
      `--build-arg TOOL_FOLDERNAME=${testConfig.title} ` +
      `--build-arg SETUP_PARAMETERS="[ ${testConfig.setupParameters} ]" ` +
      `-q`

    await this.buildDockerContainer(imageTag, testConfig.dockerRepository, buildParameters)
  }

  /**
   * Creates the test container based on the passed dockerImage and testConfig.
   * The container does not run yet.
   *
   * At first a device is tried to be allocated until one is available. Afterwards
   * the container is created. If the device is an emulator, a network is passed
   * to setup the communication. The host adb keys are mounted into the container
   * so that the container can perform 'adb connect x'.
   *
   * The following are passed as command parameters:
   * If the device is a physical device then the remote connect URL is passed, if
   * it it is an emulator the server address is passed. Both determines how the
   * application inside the container can communicate with the device.
   * Also, the tool parameters and the device serial number are passed.
   *
   * Returns the device and container id.
   */
  async createTestContainer(dockerImage, testConfig) {
    const device = await this.acquireDevice()

    const network = device.isEmulator() ? `--network ${DOCKER_NETWORK}` : ''
    const adbkeypub = path.join(this.options.adbKeysDirHost, 'adbkey.pub')
    const adbkey = path.join(this.options.adbKeysDirHost, 'adbkey')
    const createParameters = `--privileged ${network} ` +
      `-v ${adbkeypub}:${path.join(ANDROID_DIR_CONTAINER, 'adbkey.pub')} -v ${adbkey}:${path.join(ANDROID_DIR_CONTAINER, 'adbkey')}`

    let cmdParameters = device.isEmulator()
      ? `--serverAddress=${device.getServerAddress()}`
      : `--remoteConnectUrl=${device.getConnectUrl()} `
    cmdParameters += ` --toolParameters="${testConfig.toolParameters}"`
    cmdParameters += ` --deviceSerialNumber="${device.getSerialNumber()}"`

    const containerId = await this.createDockerContainer(dockerImage, createParameters, cmdParameters)
    return {device: device, containerId: containerId}
  }

  /**
   * Docker ref: https://docs.docker.com/engine/reference/commandline/build/
   */
  async buildDockerContainer(imageTag, dockerRepository, buildParameters) {
    buildParameters = buildParameters || ''
    const cmd = `docker build ${buildParameters} -t "${imageTag}" ${dockerRepository}`
    let error = null
    let stdout = ''
    let stderr = ''

    try {
      log.info(cmd)
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
   * Creates a Docker container based on the passed dockerImage, createParameters
   * and cmdParameters. The function returns the container id.
   *
   * Docker ref: https://docs.docker.com/engine/reference/commandline/create/
   */
  async createDockerContainer(dockerImage, createParameters, cmdParameters) {
    createParameters = createParameters || ''
    cmdParameters = cmdParameters || ''
    const cmd = `docker create ${createParameters} ${dockerImage} ${cmdParameters}`
    log.info(cmd)
    try {
      const stdoutObj = execSync(cmd, {maxBuffer: MAX_BUFFER, timeout: SMALL_TIMEOUT})
      const stdout = String(stdoutObj).trim()

      if (stdout === '') {
        throw Error('Creating Docker container failed with empty stdout.')
      }

      log.info('Creating Docker container finished with stdout: ' + stdout)

      // Returns the container id
      return stdout
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
    log.info(cmd)
    const stdoutObj = execSync(cmd, {maxBuffer: MAX_BUFFER, timeout: SMALL_TIMEOUT})
    const stdout = String(stdoutObj).trim()

    return stdout
  }

  /**
   * Docker ref: https://docs.docker.com/engine/reference/commandline/cp/
   */
  copyFileFromDockerContainerToHost(fileContainer, containerId, destHost) {
    const cmd = `docker cp ${containerId}:${fileContainer} ${destHost}`
    log.info(cmd)
    const stdoutObj = execSync(cmd, {maxBuffer: MAX_BUFFER, timeout: SMALL_TIMEOUT})
    const stdout = String(stdoutObj).trim()

    return stdout
  }

  /**
   * Docker ref: https://docs.docker.com/engine/reference/commandline/start/
   */
  async startDockerContainer(containerId, submitId) {
    const cmd = `docker start -a ${containerId}`
    let error = null
    let exitCode = null

    try {
      log.info(cmd)

      // Use spawnSync here, because exec returned earlier from the process though the container was still running.
      // This happened with DroidMate and multiple apks.
      const {error: _error, exitCode: _exitCode} = await this.spawnProcess(cmd, {shell: true}, submitId, false)
      error = _error
      exitCode = _exitCode
    } catch (_error) {
      error = _error
    }

    // Error happened
    if (error) {
      if (this.numberOfRetriesOnFailure > 0) {
        this.numberOfRetriesOnFailure--
        log.warn(`Docker start failed. Try it once more. Remaining retries: ${this.numberOfRetriesOnFailure}`)
        this.updateUserJobRunFailure(true)
        await this.startDockerContainer(containerId, submitId)
      } else {
        let errorStr = JSON.stringify(error, Object.getOwnPropertyNames(error))
        const errorTruncated = 'The execution was not successful: ' + truncate(errorStr)
        log.warn('errorTruncated: ' + errorTruncated)
        this.socket.emit('command.testing.tools.error', {
          id: submitId,
          message: errorTruncated
        })
        this.updateUserJobRunFailure(false)
      }
    } else {
      this.updateUserJobRunSuccess()
    }

  }

  /**
   * Docker ref: https://docs.docker.com/engine/reference/commandline/run/
   */
  async runDockerContainer(imageTag, runParameters, submitId, suppressStdout = false) {
    runParameters = runParameters || ''
    const cmd = `docker run ${runParameters} ${imageTag}`
    let error = null
    let exitCode = null

    try {
      log.info(cmd)

      // Use spawnSync here, because exec returned earlier from the process though the container was still running.
      // This happened with DroidMate and multiple apks.
      const {error: _error, exitCode: _exitCode} = await this.spawnProcess(cmd, {shell: true}, submitId, suppressStdout)
      error = _error
      exitCode = _exitCode
    } catch (_error) {
      error = _error
    }

    // Error happened
    if (error) {
      throw Error(error)
    }

  }

  /**
   * Docker ref: https://docs.docker.com/engine/reference/commandline/stop/
   */
  async stopDockerContainer(containerId, stopParameters) {
    stopParameters = stopParameters || ''
    const cmd = `docker stop ${stopParameters} ${containerId}`
    let error = null
    let stdout = ''
    let stderr = ''

    try {
      log.info(cmd)
      const {_error, _stdout, _stderr} = await exec(cmd, {maxBuffer: MAX_BUFFER, timeout: SMALL_TIMEOUT})
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
   * Docker ref: https://docs.docker.com/engine/reference/commandline/network_inspect/
   */
  static checkIfDockerNetworkExists(networkName) {
    const cmd = `docker network inspect ${networkName}`
    log.info(cmd)

    try {
      const stdoutObj = execSync(cmd, {maxBuffer: MAX_BUFFER, timeout: SMALL_TIMEOUT})
      const stdout = String(stdoutObj).trim()
      assert(stdout.includes(`"Name": "${networkName}"`))
      return true
    } catch (error) {
      const stdout = errorToString(error)
      assert(stdout.includes('Error: No such network:'))
      return false
    }
  }

  /**
   * Docker ref: https://docs.docker.com/engine/reference/commandline/network_create/
   */
  static createDockerNetwork(networkName) {
    const cmd = `docker network create --driver bridge ${networkName}`
    log.info(cmd)
    const stdoutObj = execSync(cmd, {maxBuffer: MAX_BUFFER, timeout: SMALL_TIMEOUT})
    const stdout = String(stdoutObj).trim()
  }

  spawnProcess(cmd, options, id, suppressStdout) {
    const resolver = Promise.defer()
    const child = spawn(cmd, options)
    let error = null
    let stdoutCounter = 0
    let stderrCounter = 0

    child.stdout.on('data', (data) => {
      if (!suppressStdout) {
        let stdout = String(data);
        stdoutCounter =+ stdout.length
        if (stdoutCounter <= STD_MAX_LENGTH) {
          this.reportStdout(stdout, id)
        }
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

    child.on('exit', code => {
      resolver.resolve({error: error, exitCode: code})
    })

    return resolver.promise
  }

  async submitJob(tests) {
    dbapi.insertUserJob(this.storageId, tests, this.email)
  }

  async submitJobFailure(error) {
    const errorStr = errorToString(error)
    console.log('submitJobFailure', errorStr)
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
      log.info('Found file to be unzipped: ' + zip)
      extract(zip, {dir: destDir}, function(err) {
        if (err) {
          resolver.reject(err)
        } else {
          log.info('Unzipped ' + zip)
          resolver.resolve()
        }
      })
    } else {
      resolver.reject('Expected 0 or 1 .zip file.')
    }

    return resolver.promise
  }

  reportFinished(msg, id) {
    log.info('reportFinished: ' + msg)
    this.socket.emit('command.testing.tools.finished', {
      id: id,
      message: msg
    })
  }

  reportStderr(stderr, id) {
    if (stderr && stderr !== '' && typeof stderr !== 'undefined') {
      // console.log(stderr)
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

class DockerCleanUpTestExecutor {

  async cleanup(containerExpiration, saveDir) {
    const cursor = await dbapi.loadUserJobsByFinishedDate(containerExpiration)
    const jobs = await cursor.toArray()
    if (jobs.length > 0) {
      const jobIds = jobs.map(job => job.id)
      const containerIdsSet = this.getContainerIds(jobs)
      const output = this.removeDockerContainers(containerIdsSet)
      log.info(output)
      this.removeFilesFromStorage(jobIds, saveDir)
      await this.removeDatabaseEntries(jobIds)
    }
  }

  /**
   * Docker ref: https://docs.docker.com/engine/reference/commandline/rm/
   */
  removeDockerContainers(containerIdsSet) {
    let stdout = 'No containers removed.'
    if (containerIdsSet.size > 0) {
      const cmd = `docker rm -v ${Array.from(containerIdsSet).join(' ')}`
      log.info(cmd)
      try {
        const stdoutObj = execSync(cmd, {maxBuffer: MAX_BUFFER, timeout: SMALL_TIMEOUT})
        stdout = String(stdoutObj).trim()
      } catch (error) {
        stdout = errorToString(error)
      }
    }

    return stdout
  }

  async removeDatabaseEntries(jobIds) {
    await dbapi.removeUserJobsById(jobIds)
  }

  removeFilesFromStorage(jobIds, saveDir) {
    console.log('removeFilesFromStorage', jobIds, saveDir)
    jobIds.forEach(function(jobId) {
      const dir = path.join(saveDir, jobId)
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

module.exports = function(_options) {
  assert(_options.saveDir, 'save-dir option must be defined. Have you forgotten to pass storage-options?')

  // Setup a periodic cronjob for cleaning up Docker containers and created files for the test jobs
  const job = new CronJob(`0 0 */${_options.cleanupTimeInterval} * * *`, function() {
    const executor = new DockerCleanUpTestExecutor()
    log.info(`Set up cleanup job which is triggered every ${_options.cleanupTimeInterval} days, cleaning ` +
      `containers older than ${_options.containerExpiration} days.`)
    executor.cleanup(_options.containerExpiration, _options.saveDir).then(function() {
      log.info('Periodic clean up finished.')
    })
  })
  job.start()

  // Setup Docker network for emulator container communication
  if (!TestExecutor.checkIfDockerNetworkExists(DOCKER_NETWORK)) {
    TestExecutor.createDockerNetwork(DOCKER_NETWORK)
  }

}

module.exports.executeTests = function(socket, email, tests, storageId, options) {
  log.info('executeTests options', options)
  const executor = new TestExecutor(socket, email, options)
  executor.executeTests(tests, storageId)
}
