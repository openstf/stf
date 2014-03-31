describe('UploadCtrl', function () {

  beforeEach(module('stf.upload'));

  var scope, ctrl;

  beforeEach(inject(function ($rootScope, $controller) {
    scope = $rootScope.$new();
    ctrl = $controller('UploadCtrl', {$scope: scope});
  }));

  it('should ...', inject(function () {
    expect(1).toEqual(1);

  }));

});