describe('InfoCtrl', function () {

  beforeEach(module('stf.info'));

  var scope, ctrl;

  beforeEach(inject(function ($rootScope, $controller) {
    scope = $rootScope.$new();
    ctrl = $controller('InfoCtrl', {$scope: scope});
  }));

  it('should ...', inject(function () {
    expect(1).toEqual(1);

  }));

});