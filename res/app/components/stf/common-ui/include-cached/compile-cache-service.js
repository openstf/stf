module.exports = function($http, $templateCache, $compile) {
  var cache = {}

  return function(src, scope, cloneAttachFn) {
    var compileFn = cache[src]
    if (compileFn) {
      compileFn(scope, cloneAttachFn)
    } else {
      $http.get(src, {cache: $templateCache}).success(function(response) {
        var responseContents = angular.element('<div></div>').html(response).contents()
        compileFn = cache[src] = $compile(responseContents)
        compileFn(scope, cloneAttachFn)
      })
    }
  }
}
