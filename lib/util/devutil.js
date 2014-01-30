var util = require('util')

var split = require('split')
var Promise = require('bluebird')

var wire = require('../wire')
var pathutil = require('./pathutil')

var devutil = module.exports = Object.create(null)

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
  function closedError(err) {
    return err.message === 'closed'
  }
  return adb.openTcpAsync(serial, port)
    .then(function(conn) {
      conn.end()
      throw new Error(util.format('Port "%d" should be unused', port))
    })
    .catch(closedError, function(err) {
      return Promise.resolve(port)
    })
}

devutil.waitForPort = function(adb, serial, port) {
  function closedError(err) {
    return err.message === 'closed'
  }
  return adb.openTcpAsync(serial, port)
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

devutil.listPidsByComm = function(adb, serial, comm, bin) {
  return adb.shellAsync(serial, ['ps', comm])
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
              if (cols.pop() === bin) {
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
        return devutil.waitForProcsToDie(adb, serial, comm, bin)
      }
    })
}

devutil.killProcsByComm = function(adb, serial, comm, bin, mode) {
  return devutil.listPidsByComm(adb, serial, comm, bin, mode)
    .then(function(pids) {
      if (!pids.length) {
        return Promise.resolve()
      }
      return adb.shellAsync(serial, ['kill', mode || -15].concat(pids))
        .then(function(out) {
          return new Promise(function(resolve, reject) {
            out.on('end', resolve)
          })
        })
        .then(function() {
          return devutil.waitForProcsToDie(adb, serial, comm, bin)
        })
        .timeout(1000)
        .then(function() {
          return devutil.killProcsByComm(adb, serial, comm, bin, -9)
        })
    })
}

devutil.platform = function(platform) {
  switch (platform) {
    case 'android':
      return wire.DevicePlatform.ANDROID
    default:
      throw new Error(util.format('Unmapped platform "%s"', platform))
  }
}

devutil.manufacturer = function(manufacturer) {
  switch (manufacturer.toUpperCase()) {
    case 'SONY':
    case 'SONY ERICSSON':
      return wire.DeviceManufacturer.SONY
    case 'FUJITSU':
      return wire.DeviceManufacturer.FUJITSU
    case 'HTC':
      return wire.DeviceManufacturer.HTC
    case 'SHARP':
      return wire.DeviceManufacturer.SHARP
    case 'LGE':
      return wire.DeviceManufacturer.LG
    case 'SAMSUNG':
      return wire.DeviceManufacturer.SAMSUNG
    case 'ASUS':
      return wire.DeviceManufacturer.ASUS
    case 'NEC':
      return wire.DeviceManufacturer.NEC
    case 'PANASONIC':
      return wire.DeviceManufacturer.PANASONIC
    default:
      throw new Error(util.format('Unmapped manufacturer "%s"', manufacturer))
  }
}

devutil.makeIdentity = function(serial, properties) {
  var model = properties['ro.product.model']
    , brand = properties['ro.product.brand']
    , manufacturer = properties['ro.product.manufacturer']
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
  , platform: devutil.platform('android')
  , manufacturer: devutil.manufacturer(manufacturer)
  , model: model
  , version: version
  , abi: abi
  , sdk: sdk
  }
}
