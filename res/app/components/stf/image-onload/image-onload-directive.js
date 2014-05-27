module.exports = function imageOnloadDirective($parse) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      element.bind('load', function() {
        scope.$eval(attrs.imageOnload)
//        console.log('image is loaded')
      })
    }
  }
}
