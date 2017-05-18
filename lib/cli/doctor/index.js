module.exports.command = 'doctor'

module.exports.describe = 'Diagnose potential issues with your installation.'

module.exports.builder = function(yargs) {
  return yargs
}

module.exports.handler = function() {
  var cp = require('child_process')
  var os = require('os')
  var util = require('util')

  var semver = require('semver')
  var Promise = require('bluebird')

  var pkg = require('../../../package')
  var log = require('../../util/logger').createLogger('cli:doctor')

  function CheckError() {
    Error.captureStackTrace(this, this.constructor)
    this.name = 'CheckError'
    this.message = util.format.apply(util, arguments)
  }

  util.inherits(CheckError, Error)

  function call(command, args, options) {
    return new Promise(function(resolve, reject) {
      var proc = cp.spawn(command, args, options)
      var stdout = []

      proc.stdout.on('readable', function() {
        var chunk
        while ((chunk = proc.stdout.read())) {
          stdout.push(chunk)
        }
      })

      proc.on('error', reject)

      proc.on('exit', function(code, signal) {
        if (signal) {
          reject(new CheckError('Exited with signal %s', signal))
        }
        else if (code === 0) {
          resolve(Buffer.concat(stdout).toString())
        }
        else {
          reject(new CheckError('Exited with status %s', code))
        }
      })
    })
  }

  function check(label, fn) {
    function Check() {
    }

    Check.prototype.call = function(command, args, options) {
      return call(command, args, options).catch(function(err) {
        if (err.code === 'ENOENT') {
          throw new CheckError(
            '%s is not installed (`%s` is missing)'
          , label
          , command
          )
        }

        throw err
      })
    }

    Check.prototype.extract = function(what, re) {
      return function(input) {
        return Promise.try(function() {
          var match = re.exec(input)
          if (!match) {
            throw new CheckError(util.format('%s %s cannot be detected', label, what))
          }
          return match[1]
        })
      }
    }

    Check.prototype.version = function(wantedVersion) {
      return function(currentVersion) {
        return Promise.try(function() {
          log.info('Using %s %s', label, currentVersion)
          var sanitizedVersion = currentVersion.replace(/~.*/, '')
          return semver.satisfies(sanitizedVersion, wantedVersion)
        })
        .then(function(satisfied) {
          if (!satisfied) {
            throw new CheckError(
              '%s is currently %s but needs to be %s'
            , label
            , currentVersion
            , wantedVersion
            )
          }
        })
      }
    }

    return Promise.try(function() {
        return fn(new Check())
      })
      .catch(CheckError, function(err) {
        log.error(err.message)
      })
      .catch(function(err) {
        log.error('Unexpected error checking %s: %s', label, err)
      })
  }

  function checkOSArch() {
    log.info('OS Arch: %s', os.arch())
  }

  function checkOSPlatform() {
    log.info('OS Platform: %s', os.platform())
    if (os.platform() === 'win32') {
      log.warn('STF has never been tested on Windows. Contributions are welcome!')
    }
  }

  function checkOSRelease() {
    log.info('OS Platform: %s', os.release())
  }

  function checkNodeVersion() {
    log.info('Using Node %s', process.versions.node)
  }

  function checkLocalRethinkDBVersion() {
    return check('RethinkDB', function(checker) {
      return checker.call('rethinkdb', ['--version'])
        .then(checker.extract('version', /rethinkdb ([^\s]+)/))
        .then(checker.version(pkg.externalDependencies.rethinkdb))
    })
  }

  function checkGraphicsMagick() {
    return check('GraphicsMagick', function(checker) {
      return checker.call('gm', ['-version'])
        .then(checker.extract('version', /GraphicsMagick ([^\s]+)/))
        .then(checker.version(pkg.externalDependencies.gm))
    })
  }

  function checkZeroMQ() {
    return check('ZeroMQ', function(checker) {
      var zmq = require('zmq')
      return checker.version(pkg.externalDependencies.zeromq)(zmq.version)
    })
  }

  function checkProtoBuf() {
    return check('ProtoBuf', function(checker) {
      return checker.call('protoc', ['--version'])
        .then(checker.extract('version', /libprotoc ([^\s]+)/))
        .then(checker.version(pkg.externalDependencies.protobuf))
    })
  }

  function checkADB() {
    return check('ADB', function(checker) {
      return checker.call('adb', ['version'])
        .then(checker.extract('version', /Android Debug Bridge version ([^\s]+)/))
        .then(checker.version(pkg.externalDependencies.adb))
    })
  }

  return Promise.all([
    checkOSArch()
  , checkOSPlatform()
  , checkOSRelease()
  , checkNodeVersion()
  , checkLocalRethinkDBVersion()
  , checkGraphicsMagick()
  , checkZeroMQ()
  , checkProtoBuf()
  , checkADB()
  ])
}
