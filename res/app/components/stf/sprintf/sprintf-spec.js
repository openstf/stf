describe('sprintf', function() {

	beforeEach(module('stf.sprintf'));

	it('should ...', inject(function($filter) {

    var filter = $filter('sprintf');

		expect(filter('input')).toEqual('output');

	}));

});