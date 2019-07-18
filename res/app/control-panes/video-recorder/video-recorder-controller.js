module.exports = function VideoRecorderCtrl($scope) {

  $scope.videos = []

  $scope.clear = function() {
    $scope.videos = []
  }
  
  $scope.recordVideo = () => {
    $scope.control.record()
      .then(result => {
        $scope.$apply(() => {
          $scope.recording = true
          $scope.videoPath = result.body
        })
    })
  }

  $scope.stopRecordVideo = () => {
    $scope.control.stopRecording($scope.videoPath)
      .then(result => {
        $scope.$apply(() => {
          $scope.recording = false
          $scope.videos.unshift(result)
        })
      })

  }
}
