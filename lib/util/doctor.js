var os = require('os')
var semver = require('semver')
var childProcess = require('child_process')
var rethinkdbPkg = require('rethinkdb/package')
var zmq = require('zmq')

var pkg = require('../../package')
var log = require('./logger').createLogger('util:doctor')

var doctor = module.exports = Object.create(null)

function unsupportedVersion(desc, ver, range, callback) {
  if (!semver.satisfies(ver, range)) {
    log.error(
      'Current %s version is not supported, it has to be %s'
      , desc
      , range
    )
    if (callback) {
      return callback()
    }
  }
}

function execHasErrors(error, stderr) {
  if (error) {
    if (error.code === 'ENOENT') {
      log.warn('Executable was not found')
    }
    else {
      log.error(error)
    }
    return true
  }
  if (stderr) {
    log.error('There was an error with: %s', stderr)
  }
  return false
}

function execCommand(command, param, desc, match, callback) {
  childProcess.execFile(command, [param],
    function(error, stdout, stderr) {
      if (!execHasErrors(error, stderr)) {
        if (stdout) {
          var result = stdout.replace(match, '$1')
          if (result) {
            log.info('%s %s', desc, result)
            if (callback) {
              return callback(result)
            }
          }
          else {
            log.error('There was an error with: %s', stdout)
          }
        }
      }
    }
  )
}

doctor.checkOSArch = function() {
  log.info('OS Arch: %s', os.arch())
}

doctor.checkOSPlatform = function() {
  log.info('OS Platform: %s', os.platform())
  if (os.platform() === 'win32') {
    log.warn('STF has never been tested on Windows. Contributions are welcome!')
  }
}

doctor.checkOSRelease = function() {
  log.info('OS Platform: %s', os.release())
}

doctor.checkNodeVersion = function() {
  log.info('Using Node %s', process.versions.node)
  if (pkg.engineStrict) {
    unsupportedVersion('Node', process.versions.node, pkg.engines.node)
  }
}

doctor.checkRethinkDBClient = function() {
  log.info('Using RethinkDB client %s', rethinkdbPkg.version)
}

doctor.checkLocalRethinkDBServer = function() {
  execCommand(
    'rethinkdb'
    , '--version'
    , 'Local RethinkDB server'
    , /rethinkdb (.*?) \(.*\)\n?/gm
    , function(ver) {
      unsupportedVersion(
        'Local RethinkDB server'
        , ver
        , pkg.externalDependencies.rethinkdb
      )
    })
}

doctor.checkGraphicsMagick = function() {
  execCommand(
    'gm'
    , '-version'
    , 'GraphicsMagick'
    , /GraphicsMagick ((.|\n)*?) (.|\n)*/g
    , function(ver) {
      unsupportedVersion('GraphicsMagick', ver, pkg.externalDependencies.gm)
    }
  )
}

doctor.checkZeroMQ = function() {
  log.info('Using ZeroMQ %s', zmq.version)

  unsupportedVersion('ZeroMQ', zmq.version, pkg.externalDependencies.zeromq)
}

doctor.checkProtoBuf = function() {
  execCommand(
    'protoc'
    , '--version'
    , 'ProtoBuf'
    , /^libprotoc (.*)\n$/g
    , function(ver) {
      unsupportedVersion(
        'ProtoBuf'
        , ver
        , pkg.externalDependencies.protobuf
      )
    })
}

doctor.checkADB = function() {
  execCommand(
    'adb'
    , 'version'
    , 'Local ADB'
    , /Android Debug Bridge version (\d+\.\d+\.\d+)(\n.*)?/g
    , function(ver) {
      unsupportedVersion('AD', ver, pkg.externalDependencies.adb)
    }
  )
}

doctor.checkDevices = function() {
  // Show all connected USB devices, including hubs
  if (os.platform() === 'darwin') {
    childProcess.execFile('ioreg', ['-p', 'IOUSB', '-w0'],
      function(error, stdout, stderr) {
        log.info('USB devices connected including hubs:')
        if (!execHasErrors(error, stderr)) {
          var list = stdout.replace(/@.*|\+-o Root\s{2}.*\n|\+-o |^\s{2}/gm, '')
            .split('\n')
          list.forEach(function(device) {
            log.info(device)
          })
        }
      }
    )
  }
  else if (os.platform() === 'linux') {
    childProcess.execFile('lsusb', [],
      function(error, stdout, stderr) {
        log.info('USB devices connected including hubs:')
        if (!execHasErrors(error, stderr)) {
          var list = stdout.replace(/Bus \d+ Device \d+: ID \w+:\w+ /gm, '')
            .split('\n')
          list.forEach(function(device) {
            log.info(device)
          })
        }
      }
    )
  }

  // Show all the devices seen by adb
  childProcess.execFile('adb', ['devices'],
    function(error, stdout, stderr) {
      log.info('Devices that ADB can see:')
      if (!execHasErrors(error, stderr)) {
        var s = stdout.replace(/List of devices attached \n|^\s*/gm, '')
        if (s.length === 0) {
          log.error('No devices')
        }
        else {
          var list = s.split('\n')
          list.forEach(function(device) {
            log.info(device)
          })
        }
      }
    }
  )
}

doctor.run = function(options) {
  // Check devices
  if (options.devices) {
    doctor.checkDevices()
    return
  }

  // Check OS architecture
  doctor.checkOSArch()

  // Check OS platform
  doctor.checkOSPlatform()

  // Check OS release
  doctor.checkOSRelease()

  // Check node version
  doctor.checkNodeVersion()

  // Check rethinkdb client
  doctor.checkRethinkDBClient()

  // Check local rethinkdb server
  doctor.checkLocalRethinkDBServer()

  // Check graphicsmagick
  doctor.checkGraphicsMagick()

  // Check zeromq
  doctor.checkZeroMQ()

  // Check protobuf
  doctor.checkProtoBuf()

  // Check adb
  doctor.checkADB()

  // TODO:
  // Check yasm
  // Check pkg-config
  // Check python2
  // Exit on errors
  // Run on stf local

  // Only for stf local:
  // Check if rethinkdb is running
  // Check if adb server is running
}
