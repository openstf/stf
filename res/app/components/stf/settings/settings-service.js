var Promise = require('bluebird')

module.exports = function SettingsServiceFactory($localForage) {
  var SettingsService = {}

  var loadedInMemory = false

  var memoryData = Object.create(null)

  function setItemMemory(key, value) {
    memoryData[key] = value
  }

  function getItemMemory(key) {
    return memoryData[key]
  }

  SettingsService.setItem = function (key, value) {
    setItemMemory(key, value)
    return $localForage.setItem(key, value)
  }

  function loadAllItems() {
    if (loadedInMemory) {
      return Promise.resolve()
    }

    return $localForage.getKeys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        return $localForage.getItem(key).then(setItemMemory.bind(null, key))
      }))
    }).then(function () {
      loadedInMemory = true
    })
  }

  SettingsService.getItem = function (key) {
    return loadAllItems().then(function () {
      return getItemMemory(key)
    })
  }

  SettingsService.bind = function () {



    return $localForage.bind.apply($localForage, arguments)
  }

  SettingsService.clear = function () {
    memoryData = Object.create(null)
    return $localForage.clear.apply($localForage, arguments)
  }

  return SettingsService
}
