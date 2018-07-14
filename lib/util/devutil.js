var util = require('util')

var split = require('split')
var Promise = require('bluebird')

var devutil = module.exports = Object.create(null)

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

  var findProcess = function(out) {
    return new Promise(function(resolve) {
      var header = true
      var pids = []
      var showTotalPid = false

      out.pipe(split())
        .on('data', function(chunk) {
          if (header) {
            header = false
          }
          else {
            var cols = chunk.toString().split(/\s+/)
            if (!showTotalPid && cols[0] === 'root') {
              showTotalPid = true
            }

            // last column of output would be command name containing absolute path like '/data/local/tmp/minicap'
            // or just binary name like 'minicap', it depends on device/ROM
            var lastCol = cols.pop()
            if ((lastCol === comm || lastCol === bin) && users[cols[0]]) {
              pids.push(Number(cols[1]))
            }
          }
        })
        .on('end', function() {
          resolve({showTotalPid: showTotalPid, pids: pids})
        })
    })
  }

  return adb.shell(serial, 'ps 2>/dev/null')
     .then(findProcess)
     .then(function(res) {
       // return pids if process can be found in the output of 'ps' command
       // or 'ps' command has already displayed all the processes including processes launched by root user
       if (res.showTotalPid || res.pids.length > 0) {
         return Promise.resolve(res.pids)
       }
       // otherwise try to run 'ps -elf'
       else {
         return adb.shell(serial, 'ps -lef 2>/dev/null')
           .then(findProcess)
           .then(function(res) {
              return Promise.resolve(res.pids)
           })
       }
     })
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
  var cpuPlatform = properties['ro.board.platform']
  var openGLESVersion = properties['ro.opengles.version']

  openGLESVersion = parseInt(openGLESVersion, 10)
  if (isNaN(openGLESVersion)) {
    openGLESVersion = '0.0'
  }
  else {
    var openGLESVersionMajor = (openGLESVersion & 0xffff0000) >> 16
    var openGLESVersionMinor = (openGLESVersion & 0xffff)
    openGLESVersion = openGLESVersionMajor + '.' + openGLESVersionMinor
  }

  // Remove brand prefix for consistency. Note that some devices (e.g. TPS650)
  // do not expose the brand property.
  if (brand && model.substr(0, brand.length) === brand) {
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
  , cpuPlatform: cpuPlatform
  , openGLESVersion: openGLESVersion
  }
}
