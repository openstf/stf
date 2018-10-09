module.exports = function TestingCtrl($scope, $rootScope, gettext) {

  $scope.testingTabs = [
    {
      title: gettext('Run'),
      icon: 'fa-play fa-fw',
      templateUrl: 'testing/run-test/run-test.pug'
    },
    {
      title: gettext('Jobs'),
      icon: 'fa-list fa-fw',
      templateUrl: 'testing/jobs/jobs.pug'
    }
  ]

}
