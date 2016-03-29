module.exports = function includeCachedDirective(CompileCacheService) {
  return {
    restrict: 'ECA',
    terminal: true,
    compile: function(element, attrs) {
      var srcExp = attrs.ngIncludeCached || attrs.src

      return function(scope, element) {
        var src = scope.$eval(srcExp)
        var newScope = scope.$new()
        CompileCacheService(src, newScope, function(compiledElm) {
          element.append(compiledElm)
        })
      }
    }
  }
}
