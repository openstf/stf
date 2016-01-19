var util = require('util')

var split = require('split')
var Promise = require('bluebird')

var devutil = module.exports = Object.create(null)

function closedError(err) {
  return err.message.indexOf('closed') !== -1
}

devutil.ensureUnusedPort = function(adb, serial, port) {
  return adb.openTcp(serial, port)
    .then(function(conn) {
      conn.end()
      throw new Error(util.format('Port "%d" should be unused', port))
    })
    .catch(closedError, function() {
      return Promise.resolve(port)
    })
}

devutil.waitForPort = function(adb, serial, port) {
  return adb.openTcp(serial, port)
    .then(function(conn) {
      conn.port = port
      return conn
    })
    .catch(closedError, function() {
      return Promise.delay(100)
        .then(function() {
          return devutil.waitForPort(adb, serial, port)
        })
    })
}

devutil.waitForPortToFree = function(adb, serial, port) {
  return adb.openTcp(serial, port)
    .then(function(conn) {
      var resolver = Promise.defer()

      function endListener() {
        resolver.resolve(port)
      }

      function errorListener(err) {
        resolver.reject(err)
      }

      conn.on('end', endListener)
      conn.on('error', errorListener)

      return resolver.promise.finally(function() {
        conn.removeListener('end', endListener)
        conn.removeListener('error', errorListener)
        conn.end()
      })
    })
    .catch(closedError, function() {
      return port
    })
}

devutil.listPidsByComm = function(adb, serial, comm, bin) {
  var users = {
    shell: true
  }

  return adb.shell(serial, ['ps', comm])
    .then(function(out) {
      return new Promise(function(resolve) {
        var header = false
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
  }
}
