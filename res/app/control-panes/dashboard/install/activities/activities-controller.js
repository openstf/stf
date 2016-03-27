var _ = require('lodash')

module.exports = function ActivitiesCtrl($scope) {
  $scope.selectedAction = ''
  $scope.selectedCategory = ''
  $scope.selectedData = ''
  $scope.selectedPackageName = $scope.installation &&
    $scope.installation.manifest && $scope.installation.manifest.package ?
    $scope.installation.manifest.package : ''
  $scope.selectedActivityName = ''

  $scope.activityActions = []
  $scope.activityCategories = []
  $scope.activityData = []
  $scope.packageNames = [$scope.selectedPackageName]
  $scope.activityNames = []

  $scope.$watch('installation.manifest.application', function(newValue) {
    if (newValue.activities) {
      var activityActions = []
      var activityCategories = []
      var activityData = []
      var activityNames = []

      _.forEach(newValue.activities, function(activity) {
        if (activity.name) {
          activityNames.push(activity.name)
        }

        _.forEach(activity.intentFilters, function(intentFilter) {

          _.forEach(intentFilter.actions, function(action) {
            if (action.name) {
              activityActions.push(action.name)
            }
          })

          _.forEach(intentFilter.categories, function(category) {
            if (category.name) {
              activityCategories.push(category.name)
            }
          })

          _.forEach(intentFilter.data, function(data) {
            if (data.scheme) {
              var uri = data.scheme + '://'
              if (data.host) {
                uri += data.host
              }
              if (data.port) {
                uri += data.port
              }
              if (data.path) {
                uri += '/' + data.path
              } else if (data.pathPrefix) {
                uri += '/' + data.pathPrefix
              } else if (data.pathPattern) {
                uri += '/' + data.pathPattern
              }
              activityData.push(uri)
            }
            if (data.mimeType) {
              activityData.push(data.mimeType)
            }
          })
        })
      })
      $scope.activityActions = _.uniq(activityActions)
      $scope.activityCategories = _.uniq(activityCategories)
      $scope.activityData = _.uniq(activityData)
      $scope.activityNames = _.uniq(activityNames)
    }
  })

  $scope.runActivity = function() {
    var command = 'am start'
    if ($scope.selectedAction) {
      command += ' -a ' + $scope.selectedAction
    }
    if ($scope.selectedCategory) {
      command += ' -c ' + $scope.selectedCategory
    }
    if ($scope.selectedData) {
      command += ' -d ' + $scope.selectedData
    }
    if ($scope.selectedPackageName && $scope.selectedActivityName) {
      command += ' -n ' +
        $scope.selectedPackageName + '/' + $scope.selectedActivityName
    }

    return $scope.control.shell(command)
      .then(function(result) {
        // console.log(result)
      })
  }
}
