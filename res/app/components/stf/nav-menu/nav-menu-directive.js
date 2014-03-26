/* Based on https://ryankaskel.com/blog/2013/05/27/
    a-different-approach-to-angularjs-navigation-menus */

module.exports = function ($location) {
  return function (scope, element, attrs) {
    var links = element.find('a')
    var onClass = attrs.navMenu || 'current'
    var routePattern
    var link
    var url
    var currentLink
    var urlMap = []
    var i

    if (!$location.$$html5) {
      routePattern = /\/#[^/]*/
    }

    for (i = 0; i < links.length; i++) {
      link = angular.element(links[i])
      url = link.attr('ng-href')

      if ($location.$$html5) {
        urlMap.push({url: url, link: link})
      } else {
        urlMap.push({url: url.replace(routePattern, ''), link: link})
      }
    }

    function activateLink() {
      var location = $location.path()
      var pathLink = ''

      for (i = 0; i < urlMap.length; ++i) {
        if (urlMap[i].url == location) {
          pathLink = urlMap[i].link
        }
      }

      if (pathLink) {
        if (currentLink) {
          currentLink.removeClass(onClass);
        }
        currentLink = pathLink;
        currentLink.addClass(onClass);
      }
    }

    activateLink()
    scope.$on('$routeChangeStart', activateLink)
  }
}
