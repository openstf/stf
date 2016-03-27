module.exports = function imageOnloadAnimateDirective($parse, $animate) {
  return {
    restrict: 'A',
    link: function(scope, element) {
      $animate.addClass(element, 'ng-image-not-loaded')
      element.bind('load', function() {
        $animate.removeClass(element, 'ng-image-not-loaded')

        //if(!scope.$$phase) {
        //  scope.$digest()
        //}
//        console.log('image is loaded')
      })
    }
  }
}
