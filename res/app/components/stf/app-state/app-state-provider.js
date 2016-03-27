module.exports = function AppStateProvider() {
  var values = {
    config: {
      websocketUrl: ''
    },
    user: {
      settings: {}
    }
  }

  /* global GLOBAL_APPSTATE:false */
  if (typeof GLOBAL_APPSTATE !== 'undefined') {
    values = angular.extend(values, GLOBAL_APPSTATE)
  }

  return {
    set: function(constants) {
      angular.extend(values, constants)
    },
    $get: function() {
      return values
    }
  }
}
