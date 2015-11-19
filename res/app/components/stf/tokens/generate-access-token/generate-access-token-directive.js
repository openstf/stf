module.exports = function generateAccessTokenDirective() {
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      showGenerate: '=',
      showClipboard: '=',
    },
    template: require('./generate-access-token.jade'),
    controller: function($scope, UserService) {
      $scope.generateForm = {
        title: ''
      }

      $scope.generateToken = function () {
        UserService.generateAccessToken($scope.generateForm.title)
        $scope.closeGenerateToken()
      }

      $scope.closeGenerateToken = function () {
        $scope.title = ''
        $scope.showGenerate = false
      }
    }
  }
}
