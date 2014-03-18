describe('MenuCtrl', function () {

  beforeEach(module('stf.menu'));

  var scope, ctrl;

  beforeEach(inject(function ($rootScope, $controller) {
    scope = $rootScope.$new();
    ctrl = $controller('MenuCtrl', {$scope: scope});
  }));

  it('should ...', inject(function () {
    expect(1).toEqual(1);

  }));

});