module.exports = function generateAccessTokenDirective() {
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      showGenerate: '='
    },
    template: require('./generate-access-token.jade'),
    controller: function($scope, AccessTokenService) {
      $scope.generateForm = {
        title: ''
      }

      $scope.generateToken = function() {
        AccessTokenService.generateAccessToken($scope.generateForm.title)
        $scope.closeGenerateToken()
      }

      $scope.closeGenerateToken = function() {
        $scope.title = ''
        $scope.showGenerate = false
      }
    }
  }
}
