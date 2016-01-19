module.exports = function timelineMessageDirective(Timelines, $sce, $interpolate) {

  var defaults = {
    message: '',
    type: 'info',
    ttl: 5000
  }

  return {
    restrict: 'AE',
    replace: true,
    template: '',
    transclude: true,
    link: function(scope, iElem, iAttrs, ctrls, transcludeFn) {

      var options = angular.extend({}, defaults, scope.$eval(iAttrs.timelineMessage))

      transcludeFn(function(elem, scope) {
        var e,
          html,
          interpolateFn,
          safeHtml

        // Create temporary wrapper element so we can grab the inner html
        e = angular.element(document.createElement('div'))
        e.append(elem)
        html = e.html()

        // Interpolate expressions in current scope
        interpolateFn = $interpolate(html)
        html = interpolateFn(scope)

        // Tell Angular the HTML can be trusted so it can be used in ng-bind-html
        safeHtml = $sce.trustAsHtml(html)

        // Add notification
        Timelines.add(safeHtml, options.type, options.ttl)
      })
    }
  }
}
