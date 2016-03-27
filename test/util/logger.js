var chai = require('chai')
var expect = chai.expect

var logger = require('../../lib/util/logger')

describe('Logger', function() {
  it('should have a createLogger method', function() {
    expect(logger).itself.to.respondTo('createLogger')
  })

  it('should have a setGlobalIdentifier method', function() {
    expect(logger).itself.to.respondTo('setGlobalIdentifier')
  })
})
