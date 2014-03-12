var util = require('util')

var split = require('split')
var Promise = require('bluebird')
var semver = require('semver')
var minimatch = require('minimatch')

var wire = require('../wire')
var pathutil = require('./pathutil')

var devutil = module.exports = Object.create(null)

function closedError(err) {
  return err.message.indexOf('closed') !== -1
}

devutil.matchesRequirements = function(capabilities, requirements) {
  return requirements.every(function(req) {
    var capability = capabilities[req.name]

    if (!capability) {
      return false
    }

    switch (req.type) {
      case wire.RequirementType.SEMVER:
        if (!semver.satisfies(capability, req.value)) {
          return false
        }
        break
      case wire.RequirementType.GLOB:
        if (!minimatch(capability, req.value)) {
          return false
        }
        break
      case wire.RequirementType.EXACT:
        if (capability !== req.value) {
          return false
        }
        break
      default:
        return false
    }

    return true
  })
}

devutil.vendorFiles = function(identity) {
  return {
    bin: {
      src: pathutil.vendor(util.format(
        'remote/libs/%s/remote', identity.abi))
    , dest: '/data/local/tmp/remote'
    , comm: 'remote'
    , mode: 0755
    }
  , lib: {
      src: pathutil.vendor(util.format(
        'remote/external/android-%d/remote_external.so', identity.sdk))
    , dest: '/data/local/tmp/remote_external.so'
    , mode: 0755
    }
  }
}

devutil.ensureUnusedPort = function(adb, serial, port) {
  return adb.openTcp(serial, port)
    .then(function(conn) {
      conn.end()
      throw new Error(util.format('Port "%d" should be unused', port))
    })
    .catch(closedError, function(err) {
      return Promise.resolve(port)
    })
}

devutil.waitForPort = function(adb, serial, port) {
  return adb.openTcp(serial, port)
    .then(function(conn) {
      conn.port = port
      return conn
    })
    .catch(closedError, function(err) {
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
    .catch(closedError, function(err) {
      return port
    })
}

devutil.listPidsByComm = function(adb, serial, comm, bin) {
  var users = {
    shell: true
  }

  return adb.shell(serial, ['ps', comm])
    .then(function(out) {
      return new Promise(function(resolve, reject) {
        var header = false
          , pids = []
        out.pipe(split())
          .on('data', function(chunk) {
            if (header) {
              header = false
            }
            else {
              var cols = chunk.toString().split(/\s+/)
              if (cols.pop() === bin && users[cols[0]]) {
                pids.push(+cols[1])
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
          return new Promise(function(resolve, reject) {
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
    , brand = properties['ro.product.brand']
    , manufacturer = properties['ro.product.manufacturer']
    , operator = properties['gsm.sim.operator.alpha']
    , version = properties['ro.build.version.release']
    , sdk = properties['ro.build.version.sdk']
    , abi = properties['ro.product.cpu.abi']

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
  }
}
