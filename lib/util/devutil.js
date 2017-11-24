var fs = require('fs')
var util = require('util')


var os = require('os')
var split = require('split')
var Promise = require('bluebird')

var devutil = module.exports = Object.create(null)
var logger = require('../util/logger')
var log = logger.createLogger('device:devutil')
var connect = require('net')
var dbapi = require('../db/api')

function closedError(err) {
  return err.message.indexOf('closed') !== -1
}

devutil.ensureUnusedLocalSocket = function(adb, serial, sock) {
  return adb.openLocal(serial, sock)
    .then(function(conn) {
      conn.end()
      throw new Error(util.format('Local socket "%s" should be unused', sock))
    })
    .catch(closedError, function() {
      return Promise.resolve(sock)
    })
}

devutil.waitForLocalSocket = function(adb, serial, sock) {
  return adb.openLocal(serial, sock)
    .then(function(conn) {
      conn.sock = sock
      return conn
    })
    .catch(closedError, function() {
      return Promise.delay(100)
        .then(function() {
          return devutil.waitForLocalSocket(adb, serial, sock)
        })
    })
}

devutil.listPidsByComm = function(adb, serial, comm, bin) {
  var users = {
    shell: true
  }

  return adb.shell(serial, ['ps'])
    .then(function(out) {
      return new Promise(function(resolve) {
        var header = true
        var pids = []
        out.pipe(split())
          .on('data', function(chunk) {
            if (header) {
              header = false
            }
            else {
              var cols = chunk.toString().split(/\s+/)
              if (cols.pop() === bin && users[cols[0]]) {
                pids.push(Number(cols[1]))
              }
            }
          })
          .on('end', function() {
            resolve(pids)
          })
      })
    })
}

devutil.getRunningAVDName = function (cmd, serial, provider) {
  var client = new connect.Socket()
  client.connect(serial.split('-')[1], 'localhost', () => {
    log.info('Connected to server')
    client.write(cmd)
  })

  client.on('data', (data) => {
    emulator_name = data.toString().split('\n')[2].replace('\r','')
    log.info("Emulator_name is: " + emulator_name)
    log.info("Serial for emulator is: " + serial)
    if (emulator_name.length > 0 ) {
      if (serial.indexOf('-') !== -1){
        serial = provider + '-' + serial.split('-').pop(-1)
        log.info("New serial is :" + serial)
      }
      dbapi.setDeviceEmulatorName(serial, emulator_name);
      }
    return emulator_name
  })
}

devutil.restartEmulatorByName = function (emulator_name, serial) {
  function pathExists(path) {
    try {
      return fs.statSync(path).isFile();
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log('Wrong path to ANDROID_SDK. Does not contain android, emulator binaries. Emulator functionality might to be disabled on this machine')
        return false
      }
      console.log('Exception fs.statSync (' + path + '): ' + e);
      return false
    }
  }

  var binaryOSName = 'emulator';
  if ( os.type() === 'Windows_NT' ) {
      binaryOSName = 'emulator.exe'
  }

  if (pathExists(process.env.ANDROID_HOME + '/tools/' + binaryOSName) === true) {
    var androidSdkPath = process.env.ANDROID_HOME + '/tools/'
    var cmdExec=require('node-cmd');
    function startEmulator(sdk_path, binaryOSName, name, serial) {
        var cmd = sdk_path + binaryOSName + ' -avd ' + name + ' -port ' +  serial
        cmdExec.get(
            cmd,
            function(err, data, stderr) {

              try{
                log.info("Err:" + err.toString())
                if (error_msg.indexOf("There's another emulator instance running with the current AVD") >-1) {
                  return "restart"
                }
              } catch (err) {}

              try{
                log.info("Data:" + data.toString())
              }
              catch (err) {}
              return "done"
            }
        )
      }
    if (startEmulator(androidSdkPath, binaryOSName, emulator_name, serial) === "restart"){
      devutil.killAVD(serial)
      startEmulator(androidSdkPath, binaryOSName, emulator_name, serial)
    }
  }
}

devutil.waitForProcsToDie = function(adb, serial, comm, bin) {
  return devutil.listPidsByComm(adb, serial, comm, bin)
    .then(function(pids) {
      if (pids.length) {
        return Promise.delay(100)
          .then(function() {
            return devutil.waitForProcsToDie(adb, serial, comm, bin)
          })
      }
    })
}

devutil.killProcsByComm = function(adb, serial, comm, bin, mode) {
  return devutil.listPidsByComm(adb, serial, comm, bin, mode)
    .then(function(pids) {
      if (!pids.length) {
        return Promise.resolve()
      }
      return adb.shell(serial, ['kill', mode || -15].concat(pids))
        .then(function(out) {
          return new Promise(function(resolve) {
            out.on('end', resolve)
          })
        })
        .then(function() {
          return devutil.waitForProcsToDie(adb, serial, comm, bin)
        })
        .timeout(2000)
        .catch(function() {
          return devutil.killProcsByComm(adb, serial, comm, bin, -9)
        })
    })
}

devutil.makeIdentity = function(serial, properties) {
  var model = properties['ro.product.model']
  var brand = properties['ro.product.brand']
  var manufacturer = properties['ro.product.manufacturer']
  var operator = properties['gsm.sim.operator.alpha'] ||
        properties['gsm.operator.alpha']
  var version = properties['ro.build.version.release']
  var sdk = properties['ro.build.version.sdk']
  var abi = properties['ro.product.cpu.abi']
  var product = properties['ro.product.name']
  var build_characteristics = properties["ro.build.characteristics"]

  // Remove brand prefix for consistency
  if (model.substr(0, brand.length) === brand) {
    model = model.substr(brand.length)
  }

  // Remove manufacturer prefix for consistency
  if (model.substr(0, manufacturer.length) === manufacturer) {
    model = model.substr(manufacturer.length)
  }

  // Clean up remaining model name
  // model = model.replace(/[_ ]/g, '')
  return {
    serial: serial
  , platform: 'Android'
  , manufacturer: manufacturer.toUpperCase()
  , operator: operator || null
  , model: model
  , version: version
  , abi: abi
  , sdk: sdk
  , product: product
  , build_char : build_characteristics
  }
}
