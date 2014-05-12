describe('timelines', function () {

  beforeEach(module('stf.timelines'));

  var scope, compile;

  beforeEach(inject(function ($rootScope, $compile) {
    scope = $rootScope.$new();
    compile = $compile;
  }));

  it('should ...', function () {

    /* 
     To test your directive, you need to create some html that would use your directive,
     send that through compile() then compare the results.

     var element = compile('<div timelines name="name">hi</div>')(scope);
     expect(element.text()).toBe('hello, world');
     */

  });
});