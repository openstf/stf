describe('StoreAccountCtrl', function () {

  beforeEach(module('stf.store-account'));

  var scope, ctrl;

  beforeEach(inject(function ($rootScope, $controller) {
    scope = $rootScope.$new();
    ctrl = $controller('StoreAccountCtrl', {$scope: scope});
  }));

  it('should ...', inject(function () {
    expect(1).toEqual(1);

  }));

});