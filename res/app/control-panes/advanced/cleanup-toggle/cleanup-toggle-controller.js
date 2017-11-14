module.exports = function($scope, gettext, $filter) {

  $scope.cleanUp = function() {
    $scope.control.wipeout().then(function(result) {
          console.error(result)
        })
      }
;}
