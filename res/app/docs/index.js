require('./docs.css')

module.exports = angular.module('stf.help.docs', [])
  .config(['$routeProvider', function ($routeProvider) {

    $routeProvider.when('/docs/:lang/:document*', {
      templateUrl: function (params) {
        var document = params.document.replace('.md', '')
        return '/static/docs/' + params.lang + '/' + document
      }
    })

  }])
  .controller('DocsCtrl', require('./docs-controller'))
