module.exports = function PageVisibilityServiceFactory($rootScope) {
  var service = {
    hidden: false
  }

  function visibilityChangeListener() {
    service.hidden = document.hidden
    $rootScope.$broadcast('visibilitychange', service.hidden)
  }

  document.addEventListener(
    'visibilitychange'
  , visibilityChangeListener
  , false
  )

  return service
}
