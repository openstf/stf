module.exports = function JobsCtrl($scope, $rootScope, JobsService, LargeErrorMessageService) {

  $scope.jobs = []

  function updateJobs() {
    JobsService.getJobs()
      .success(function(response) {
        $scope.jobs = response.jobs || []
      })
  }

  $scope.getFormattedDate = function(timestamp) {
    return new Date(timestamp).toLocaleString()
  }

  $scope.getTimeDifference = function(job) {
    const jobStart = new Date(job.startDate)
    const jobEndReference = job.status === 'Running' ? new Date() : new Date(job.finishedDate)
    let timeDiff = jobEndReference.getTime() - jobStart.getTime()
    const ms = timeDiff % 1000
    timeDiff = (timeDiff - ms) / 1000
    const secs = timeDiff % 60
    timeDiff = (timeDiff - secs) / 60
    const mins = timeDiff % 60
    const hrs = (timeDiff - mins) / 60

    return `${hrs}h ${mins}m ${secs}s`
  }

  $scope.downloadTestResults = function(storageId) {
    location.href = '/s/download/report/' + storageId + '?download'
  }

  $scope.showErrorMessage = function(storageId) {
    JobsService.getJobsErrorMessage(storageId).then(function(errorMsg) {
      LargeErrorMessageService.open(errorMsg, 'Job error message').then(function() {

      })
    })
  }

  $scope.$on('command.testing.tools.finished', updateJobs)
  updateJobs()
}
