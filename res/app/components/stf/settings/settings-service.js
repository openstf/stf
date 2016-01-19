var _ = require('lodash')

module.exports = function SettingsServiceFactory(
  $rootScope
, UserService
, socket
) {
  var SettingsService = {}

  var settings = UserService.currentUser.settings || {}
  var syncListeners = []

  function createListener(object, options, monitor) {
    var source = options.source || options.target
    return function() {
      var value = object[options.target] = (source in settings) ?
        settings[source] :
        options.defaultValue

      if (monitor) {
        monitor(value)
      }
    }
  }

  function applyDelta(delta) {
    // TODO: This causes chaos
    $rootScope.safeApply(function() {
      _.merge(settings, delta, function(a, b) {
        // New Arrays overwrite old Arrays
        if (_.isArray(b)) {
          return b
        }
      })

      for (var i = 0, l = syncListeners.length; i < l; ++i) {
        syncListeners[i]()
      }
    })
  }

  SettingsService.update = function(delta) {
    socket.emit('user.settings.update', delta)
    applyDelta(delta)
  }

  SettingsService.get = function(key) {
    return settings[key]
  }

  SettingsService.set = function(key, value) {
    var delta = Object.create(null)
    delta[key] = value
    SettingsService.update(delta)
  }

  SettingsService.reset = function() {
    socket.emit('user.settings.reset')
    settings = {}
    applyDelta(null)
  }

  SettingsService.bind = function(scope, options) {
    function value(possibleValue, defaultValue) {
      return (typeof possibleValue !== 'undefined') ? possibleValue : defaultValue
    }

    var source = options.source || options.target
    var defaultValue = value(options.defaultValue, scope[options.target])

    scope.$watch(
      options.target
    , function(newValue, oldValue) {
        // Skip initial value.
        if (newValue !== oldValue) {
          var delta = Object.create(null)
          delta[source] = angular.copy(newValue)
          SettingsService.update(delta)
        }
      }
    , true
    )

    scope.$watch(
      function() {
        return settings[source]
      }
    , function(newValue, oldValue) {
        // Skip initial value. The new value might not be different if
        // settings were reset, for example. In that case we fall back
        // to the default value.
        if (newValue !== oldValue) {
          scope[options.target] = value(newValue, defaultValue)
        }
      }
    , true
    )

    scope[options.target] = value(settings[source], defaultValue)
  }

  SettingsService.sync = function(object, options, monitor) {
    var listener = createListener(object, options, monitor)
    listener() // Initialize
    return syncListeners.push(listener) - 1
  }

  SettingsService.unsync = function(id) {
    syncListeners.splice(id, 1)
  }

  socket.on('user.settings.update', applyDelta)

  return SettingsService
}
