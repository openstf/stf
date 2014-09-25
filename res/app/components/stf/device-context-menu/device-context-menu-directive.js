module.exports = function deviceContextMenuDirective($window) {
  return {
    restrict: 'EA',
    replace: false,
    //scope: {
    //  control: '&',
    //  device: '&'
    //},
    transclude: true,
    template: require('./device-context-menu.jade'),
    link: function (scope, element, attrs) {
      //var device = scope.device()
      //var control = scope.control()
      scope.windowClose = function () {
        $window.close()
      }

      function saveToDisk(fileURL, fileName) {
        // for non-IE
        if (!$window.ActiveXObject) {
          var save = document.createElement('a')
          save.href = fileURL
          save.target = '_blank'
          save.download = fileName || 'unknown'

          var event = document.createEvent('Event')
          event.initEvent('click', true, true)
          save.dispatchEvent(event)
          if ($window.URL) {
            $window.URL.revokeObjectURL(save.href)
          } else if ($window.webkitURL) {
            $window.webkitURL.revokeObjectURL(save.href)
          }
        }

        // for IE
        else if (!!$window.ActiveXObject && document.execCommand) {
          var _window = $window.open(fileURL, '_blank')
          _window.document.close()
          _window.document.execCommand('SaveAs', true, fileName || fileURL)
          _window.close()
        }
      }

      scope.saveScreenShot = function () {
        scope.control.screenshot().then(function (result) {
          saveToDisk(result.body.href, result.body.date + '.jpg')
        })
      }

    }
  }
}
