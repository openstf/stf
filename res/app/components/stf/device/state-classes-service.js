module.exports = function StateClassesService() {
  var service = {}

  service.stateButton = function(state) {
    var stateClasses = {
      using: 'state-using btn-primary',
      busy: 'state-busy btn-warning',
      available: 'state-available btn-primary-outline',
      ready: 'state-ready btn-primary-outline',
      present: 'state-present btn-primary-outline',
      preparing: 'state-preparing btn-primary-outline btn-success-outline',
      unauthorized: 'state-unauthorized btn-danger-outline',
      offline: 'state-offline btn-warning-outline'
    }[state]
    if (typeof stateClasses === 'undefined') {
      stateClasses = 'btn-default-outline'
    }
    return stateClasses
  }

  service.stateColor = function(state) {
    var stateClasses = {
      using: 'state-using',
      busy: 'state-busy',
      available: 'state-available',
      ready: 'state-ready',
      present: 'state-present',
      preparing: 'state-preparing',
      unauthorized: 'state-unauthorized',
      offline: 'state-offline'
    }[state]
    if (typeof stateClasses === 'undefined') {
      stateClasses = ''
    }
    return stateClasses
  }

  return service
}

