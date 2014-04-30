describe('ActivityCtrl', function () {

  beforeEach(module('stf.activity'));

  var scope, ctrl;

  beforeEach(inject(function ($rootScope, $controller) {
    scope = $rootScope.$new();
    ctrl = $controller('ActivityCtrl', {$scope: scope});
  }));

  it('should ...', inject(function () {
    expect(1).toEqual(1);

  }));

});