describe('LogsCtrl', function() {

  beforeEach(angular.mock.module(require('./').name))

  var scope, ctrl

  beforeEach(inject(function($rootScope, $controller) {
    scope = $rootScope.$new()
    if (Object.keys($rootScope.LogcatService).length > 0) {
      scope.deviceEntries = $rootScope.LogcatService
    }
    ctrl = $controller('LogsCtrl', {$scope: scope})
  }))

  it('should ...', inject(function() {
    expect(1).toEqual(1)

  }))

})
