module.exports = function SettingsServiceFactory($localForage) {
  var loadedInMemory = false

  $localForage.memoryData = {}

  function setItemMemory(key, value) {
    $localForage.memoryData[key] = value
  }

  function getItemMemory(key) {
    var ret
    if (typeof $localForage.memoryData[key] !== 'undefined') {
      ret = $localForage.memoryData[key]
    }
    return ret
  }

  $localForage.setItemSync = function (key, value) {
    setItemMemory(key, value)

    $localForage.setItem(key, value, function () {
      console.log('Finished saving to local forage', key, value)
    })
  }

  $localForage.getAllItemsSync = function () {
    $localForage.getKeys().then(function (keys) {
      for (var i = 0; i < keys.length; ++i) {
        $localForage.getItem(keys[i]).then(setItemMemory.bind(null, keys[i]))
      }
    })
    // FIX: This is not sync
    loadedInMemory = true
  }

  $localForage.getItemSync = function (key) {
    if (!loadedInMemory) {
      console.log('Loading for the first time')
      $localForage.getAllItemsSync(function () {
        console.log(getItemMemory(key))
      })
    }

    setTimeout(function () {
      console.log(getItemMemory(key))
    }, 1000)

    return getItemMemory(key)
  }

  $localForage.bindSync = function (scope, opts) {

  }


  return $localForage
}
