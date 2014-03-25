module.exports = function ($location) {
  return function (scope, element, attrs) {
    var links = element.find('a')
    var onClass = attrs.navMenu || 'current'
    var routePattern
    var link
    var url
    var currentLink
    var urlMap = {}
    var i

    if (!$location.$$html5) {
      routePattern = /^#[^/]*/
    }

    for (i = 0; i < links.length; i++) {
      link = angular.element(links[i])
      url = link.attr('href')

      if ($location.$$html5) {
        urlMap[url] = link
      } else {
        urlMap[url.replace(routePattern, '')] = link
      }
    }

    scope.$on('$routeChangeStart', function () {
      var pathLink = urlMap[$location.path()]

      if (pathLink) {
        if (currentLink) {
          currentLink.removeClass(onClass);
        }
        currentLink = pathLink;
        currentLink.addClass(onClass);
      }
    })
  }
}