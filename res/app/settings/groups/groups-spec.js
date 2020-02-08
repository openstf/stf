/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

describe('GroupsCtrl', function() {

  beforeEach(angular.mock.module(require('./index').name))

  var scope, ctrl

  beforeEach(inject(function($rootScope, $controller) {
    scope = $rootScope.$new()
    ctrl = $controller('GroupsCtrl', {$scope: scope})
  }))

  it('should ...', inject(function() {
    expect(1).toEqual(1)

  }))

})
