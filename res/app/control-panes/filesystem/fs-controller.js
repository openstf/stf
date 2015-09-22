module.exports = function FsCtrl($scope, $timeout) {
  $scope.search = ''
  $scope.files = [];
  $scope.paths = [];

  var listdir = function(){
    var path = '/'+$scope.paths.join('/');
    $scope.control.fslist(path)
      .then(function(result){
        $scope.files = result.body;
        $scope.$digest();
      })
      .catch(function(err){
        alert(err.message);
      })
  }

  $scope.dirEnter = function(name){
    if (name){
      $scope.paths.push(name);
    }
    listdir();
    $scope.search = '';
  }

  $scope.dirJump = function(){
    if ($scope.paths.length !== 0){
      $scope.paths.pop();
    }
    listdir();
  }

  $scope.getFile = function(file){
    var path = '/'+$scope.paths.join('/')+'/'+file;
    $scope.control.fsretrive(path)
      .then(function(result){
        location.href = result.body.href+"?download"
      })
      .catch(function(err){
        alert(err.message);
      })
  }


  // init
  // $scope.list($scope.dir); // FIXME(ssx): can't call immediately, do not known why.
  $timeout(function(){
    listdir();
  }, 800);
}
