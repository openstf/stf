module.exports = function LogsCtrl($scope, socket) {

  var filters = []

  socket.scoped($scope).on('logcat.entry', function (entry) {
    console.log(entry)
  })


  $scope.$watch('started', function (newValue, oldValue) {
    if (newValue !== oldValue) {

      if (newValue) {
        $scope.control.startLogcat(filters).then(function (result) {

        })
      } else {
        $scope.control.stopLogcat()
      }

    }

  });
}
