require('./vs-repeat.less')

require('angular-vs-repeat')

module.exports = angular.module('stf.vs-repeat', [
  'vs-repeat'
])
  .controller('PerfVsRepeatCtrl', require('./vs-repeat-controller'))
  .controller('AppVsRepeatCtrl', require('./app-controller'))
  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/test/samples/vs-repeat', {
      template: require('./vs-repeat.html')
    })
  }])
