module.exports = function JobsServiceFactory(
  $rootScope
  , $http
) {
  const JobsService = {}

  JobsService.getJobs = function() {
    return $http.get('/api/v1/jobs/')
  }

  JobsService.getJobsErrorMessage = function(storageId) {
    return $http.get('/api/v1/jobs/error/' + storageId)
  }

  return JobsService
}
