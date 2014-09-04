describe('install', function() {

  beforeEach(angular.mock.module(require('./').name))

	it('should ...', inject(function($filter) {

    var filter = $filter('install')

		expect(filter('input')).toEqual('output')

	}))

})
