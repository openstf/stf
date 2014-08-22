module.exports = function AppStateProvider() {
  var values = {
    config: {
      websocketUrl: ''
    },
    user: {
      settings: {}
    }
  }

  /*globals GLOBAL_APPSTATE:false*/
  if (GLOBAL_APPSTATE) {
    values = angular.extend(values, GLOBAL_APPSTATE)
  }

  return {
    set: function (constants) {
      angular.extend(values, constants)
    },
    $get: function () {
      return values
    }
  }
}
