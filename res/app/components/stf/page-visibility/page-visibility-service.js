module.exports = function PageVisibilityServiceFactory($rootScope) {
  var service = {}

  function visibilityChangeListener() {
    $rootScope.$broadcast('visibilitychange', document.hidden)
  }

  document.addEventListener(
    'visibilitychange'
  , visibilityChangeListener
  , false
  )

  return service
}
