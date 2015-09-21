module.exports = function TopAppCtrl($scope) {
  $scope.pkgName = ""
  $scope.pkgActivity = ""
  $scope.pkgPid = ""

  var shell = function(command, callback) {
    var promise = $scope.control.shell(command + '|| echo -n FFF');
    promise
      .then(function(result){
        var body = result.data.join('');
        var success = true;
        if (body.substr(-3) == 'FFF'){
          success = false;
          body = body.substr(0, body.length-3);
        }
        $scope.$apply(function(){
          if(callback && typeof callback === 'function'){
            callback({data: body, success: success});
          }
        })
      })
  }

  $scope.updateApp = function(){
    shell("dumpsys activity top", function(res){
      var m = res.data.match(/\s*ACTIVITY ([A-Za-z0-9_.]+)\/([A-Za-z0-9_.]+) \w+ pid=(\d+)/)
      console.log(m[1]);
      $scope.pkgName = m[1];
      $scope.pkgActivity = m[2];
      $scope.pkgPid = m[3];
    })
  }

  $scope.killApp = function(){
    shell("am force-stop "+$scope.pkgName, function(res){
      if (res.success){
        $scope.pkgPid = "";
      }
    })
  }

  $scope.startApp = function(){
    var command = ['monkey', '-p', $scope.pkgName, 
      '-c', 'android.intent.category.LAUNCHER', '1'].join(' ');
    shell(command, function(res){
      console.log(res.success);
    })
  }

  $scope.clear = function () {
    $scope.pkgName = ""
    $scope.pkgActivity = ""
    $scope.pkgPid = ""
  }
}
