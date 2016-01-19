module.exports = function enableAutofillDirective($rootElement, $cookies) {
  return {
    restrict: 'A',
    compile: function compile(tElement, tAttrs) {

      // Creates hidden iFrame for auto-fill forms if there isn't one already
      if ($rootElement.find('iframe').attr('name') !== '_autofill') {
        $rootElement.append(angular.element(
          '<iframe src="about:blank" name="_autofill" style="display:none">'
        ))
      }

      // Add attribute method POST to the current form
      if (!tAttrs.method) {
        tElement.attr('method', 'post')
      } else {
        if (!tAttrs.method.match(/post/i)) {
          throw new Error('Auto-fill only works with form POST method')
        }
      }

      // Add attribute target to the current form
      if (!tAttrs.target) {
        tElement.attr('target', '_autofill')
      }

      // Add action attribute if not present
      if (!tAttrs.action) {

        // Use a dummy url because 'about:blank' trick doesn't work with HTTPS
        // Also 'javascript: void(0)' doesn't work neither
        var dummyUrl = '/app/api/v1/dummy'

        // Adds the CSRF token to the url from cookies if present
        var xsrfToken = $cookies['XSRF-TOKEN']
        if (xsrfToken) {
          // Note: At least for Express CSURF, it only works with url-set tokens
          // it doesn't happen to work with hidden form input elements
          dummyUrl += '?_csrf=' + xsrfToken
        }

        tElement.attr('action', dummyUrl)
      }

      return {
        pre: function(scope, element, attrs) {
          // Angular needs this so the form action doesn't get removed
          // Also, trying to set a url at this time doesn't work neither
          attrs.action = ''
        }
      }
    }
  }
}
