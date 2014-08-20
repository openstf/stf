describe('greeter', function () {

  function greet(str) {
    return 'Hello, ' + str
  }

  it('should say Hello to the World', function () {
    expect(greet('World!')).toEqual('Hello, World!')
  })

})
