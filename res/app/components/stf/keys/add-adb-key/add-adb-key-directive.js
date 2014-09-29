module.exports = function addAdbKeyDirective(AdbKeysService) {
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      showAdd: '=',
      showClipboard: '='
    },
    template: require('./add-adb-key.jade'),
    link: function (scope) {
      scope.addForm = {
        title: '',
        key: ''
      }

      scope.addKey = function () {
        console.log('Add key')
        scope.closeAddKey()
      }

      scope.closeAddKey = function () {
        scope.addForm.title = ''
        scope.addForm.key = ''
        console.log('scope', scope)
        // TODO: cannot access to the form by name inside a directive?
        //scope.adbkeyform.$setPristine()
        scope.showAdd = false
      }

      scope.$watch('addForm.key', function (newValue) {
        if (newValue && !scope.addForm.title) {
          // By default sets the title to the ADB key comment because
          // usually it happens to be username@hostname.
          scope.addForm.title = AdbKeysService.commentFromKey(newValue)
        }
      })

    }
  }
}
