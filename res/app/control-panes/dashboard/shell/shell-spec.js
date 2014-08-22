describe('ShellCtrl', function () {

  beforeEach(angular.mock.module(require('./').name))

  var scope, ctrl

  beforeEach(inject(function ($rootScope, $controller) {
    scope = $rootScope.$new()
    ctrl = $controller('ShellCtrl', {$scope: scope})
  }))

  it('should have a reference url', inject(function () {
    expect(scope.referenceUrl).toEqual('/#!/help/shell')
  }))

  it('should clear the results', inject(function () {
    scope.result = ['result']
    scope.run('clear')
    expect(scope.result).toBe(null)
    expect(scope.data).toBe('')
    expect(scope.command).toBe('')
  }))

})
