module.exports = function ($scope) {
  function getArray(size) {
    var arr = [];
    for (var i = 0; i < size; i++) {
      arr.push({
        a: '',
        b: ''
      })
    }
    return arr;
  }

  $scope.$watch('arraySize', function (s) {
    $scope.bar = getArray(+s);
  });

  var interval = setInterval(function interval() {
    var t1 = Date.now();
    $scope.$digest();
    $scope.digestDuration = (Date.now() - t1);
  }, 1000);

  $scope.$on('$destroy', function () {
    clearInterval(interval);
  });
}
