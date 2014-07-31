module.exports = function enableAutofillDirective($rootElement) {
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
          console.error('Auto-fill only works with form POST method')
        }
      }

      // Add attribute target to the current form
      if (!tAttrs.target) {
        tElement.attr('target', '_autofill')
      }

      // Add attribute action to the current form
      // NOTE: This doesn't work so it has to be added manually
      // if (!tAttrs.action) {
      //   tElement.attr('action', 'about:blank')
      // }
    }
  }
}
