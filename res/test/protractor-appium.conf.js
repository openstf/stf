var config = require('./protractor.conf').config

config.seleniumAddress = 'http://localhost:4723/wd/hub'
config.chromeOnly = false
//config.capabilities = {
//  platformName: 'iOS',
//  deviceName: 'iPhone Simulator',
//  browserName: 'Safari'
//}

config.capabilities = {
  platformName: 'Android',
  deviceName: '',
  browserName: 'Chrome'
}

module.exports.config = config
