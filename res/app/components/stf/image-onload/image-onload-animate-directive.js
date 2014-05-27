module.exports = function imageOnloadAnimateDirective($parse, $animate) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      $animate.addClass(element, 'ng-image-not-loaded')
      element.bind('load', function () {
        $animate.removeClass(element, 'ng-image-not-loaded')
//        console.log('image is loaded')
      })
    }
  }
}
