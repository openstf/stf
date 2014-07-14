define(['./module'], function(mod) {
  mod.controller('SignInCtrl', ['$scope', '$http', function($scope, $http) {
    $scope.error = null

    $scope.submit = function() {
      var data = {
        name: $scope.signin.name.$modelValue
      , email: $scope.signin.email.$modelValue
      }
      $scope.invalid = false
      $http.post('/api/v1/auth/mock', data)
        .success(function(response) {
          $scope.error = null
          location.replace(response.redirect)
        })
        .error(function(response) {
          switch (response.error) {
            case 'ValidationError':
              $scope.error = {
                $invalid: true
              }
              break
            case 'InvalidCredentialsError':
              $scope.error = {
                $incorrect: true
              }
              break
            default:
              $scope.error = {
                $server: true
              }
              break
          }
        })
    }
  }])
})
