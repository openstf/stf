describe('clearButton', function() {

  beforeEach(angular.mock.module(require('./').name))

  var scope, compile

  beforeEach(inject(function($rootScope, $compile) {
    scope = $rootScope.$new()
    compile = $compile
  }))

  it('should display a text label', function() {
    var element = compile('<clear-button />')(scope)
    expect(element.find('span').text()).toBe('Clear')
  })

  it('should display a trash icon', function() {
    var element = compile('<clear-button />')(scope)
    expect(element.find('i')[0].getAttribute('class')).toMatch('fa-trash-o')
  })

})
