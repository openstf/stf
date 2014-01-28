var util = require('util')

var wire = require('../wire')

var devutil = module.exports = Object.create(null)

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
