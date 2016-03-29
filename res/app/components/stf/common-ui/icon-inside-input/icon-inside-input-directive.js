module.exports = function iconInsideInputDirective() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      // NOTE: this doesn't work on Chrome with auto-fill, known Chrome bug
      element.css({
        'background-repeat': 'no-repeat',
        'background-position': '8px 8px',
        'padding-left': '30px'
      })

      attrs.$observe('iconInsideInput', function(value) {
        element.css({
          'background-image': 'url(' + value + ')'
        })
      })
    }
  }
}
