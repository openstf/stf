/* Based on https://ryankaskel.com/blog/2013/05/27/
 a-different-approach-to-angularjs-navigation-menus */

module.exports = function($location) {
  return {
    restrict: 'EA',
    scope: {},
    link: function(scope, element, attrs) {
      var links = element.find('a')
      var onClass = attrs.navMenu || 'current'
      var urlMap = []
      var routePattern, link, url

      if (!$location.$$html5) {
        routePattern = /\/#[^/]*/
      }

      for (var i = 0; i < links.length; i++) {
        link = angular.element(links[i])
        url = link.attr('ng-href')

        // Remove angular route expressions
        url = url.replace(/\/{{.*}}/g, '')

        if ($location.$$html5) {
          urlMap.push({url: url, link: link})
        } else {
          urlMap.push({url: url.replace(routePattern, ''), link: link})
        }
      }

      function activateLink() {

        var location = $location.path()
        var pathLink = ''

        for (var i = 0; i < urlMap.length; ++i) {
          if (location.search(urlMap[i].url) !== -1) {
            pathLink = urlMap[i].link
          }
        }

        // Remove all active links
        for (var j = 0; j < links.length; j++) {
          link = angular.element(links[j])
          link.removeClass(onClass)
        }

        if (pathLink) {
          pathLink.addClass(onClass)
        }
      }

      activateLink()
      scope.$on('$routeChangeStart', activateLink)
    }
  }
}
