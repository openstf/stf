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
        // TODO: cannot access to the form by name?
        //scope.adbkeyform.$setPristine()
        scope.showAdd = false
      }

      scope.$watch('addForm.key', function (newValue) {
        if (newValue && !scope.addForm.title) {
          scope.addForm.title = AdbKeysService.hostNameFromKey(newValue)
        }
      })

    }
  }
}
