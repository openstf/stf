module.exports = function addTestingToolDirective(TestingToolsService) {
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      showAdd: '=',
      showClipboard: '='
    },
    template: require('./add-testing-tool.pug'),
    controller: function($scope, TestingToolsService) {
      const gitRepositoryDefault = 'https://github.com/uds-se/droidmate'
      const gitCommitDefault = 'master'
      const setupParametersDefault = ''
      const dockerRepositoryDefault = 'https://github.com/uds-se/droidmatedockerenv.git#farmtesting'

      $scope.addForm = {
        title: ''
        , gitRepository: gitRepositoryDefault
        , gitCommit: gitCommitDefault
        , setupParameters: setupParametersDefault
        , dockerRepository: dockerRepositoryDefault
      }

      $scope.$on('testing.tool.error', function(event, error) {
        $scope.$apply(function() {
          $scope.error = error.message
        })
      })

      $scope.$on('testing.tool.updated', function() {
        $scope.closeAddTestingTool()
      })

      $scope.addTestingTool = function() {
        TestingToolsService.addTestingTool({
          title: $scope.addForm.title
          , gitRepository: $scope.addForm.gitRepository
          , gitCommit: $scope.addForm.gitCommit
          , setupParameters: $scope.addForm.setupParameters
          , dockerRepository: $scope.addForm.dockerRepository
        })
      }

      $scope.closeAddTestingTool = function() {
        $scope.addForm.title = ''
        $scope.addForm.gitRepository = gitRepositoryDefault
        $scope.addForm.gitCommit = gitCommitDefault
        $scope.addForm.setupParameters = setupParametersDefault
        $scope.addForm.dockerRepository = dockerRepositoryDefault
        $scope.showAdd = false
        $scope.error = ''
      }
    }
  }
}
