module.exports = {
  makeIdentity: function(serial, properties) {
    var model = properties['ro.product.model']
      , brand = properties['ro.product.brand']
      , manufacturer = properties['ro.product.manufacturer']
      , version = properties['ro.build.version.release']
      , sdk = +properties['ro.build.version.sdk']
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
    model = model.replace(/[_ ]/g, '')

    return {
      platform: 'android'
    , serial: serial
    , manufacturer: manufacturer
    , model: model
    , version: version
    , sdk: sdk
    , abi: abi
    }
  }
}
