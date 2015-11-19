module.exports = function AccessTokensCtrl($scope, $http, UserService) {

    $scope.accessTokens = []
    $scope.newToken = null

    function updateTokens() {
      $scope.accessTokens = UserService.getAccessTokens()
    }

    $scope.removeToken = function (title) {
      UserService.removeAccessToken(title)
    }

    $scope.tokenGenerated = function() {
      $scope.accessToken = ''
      $scope.showGenerated = false
      UserService.getAccessTokens().push($scope.newToken)
      $scope.newToken = null
      updateTokens()
    }

    $scope.$on('user.keys.accessTokens.generated', function(event, token) {
      $scope.showGenerated = true
      $scope.accessTokenId = token.tokenId
      $scope.newToken = token
    })

    $scope.$on('user.keys.accessTokens.updated', updateTokens)

    updateTokens()
}
