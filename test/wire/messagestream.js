var sinon = require('sinon')
var chai = require('chai')
chai.use(require('sinon-chai'))
var expect = chai.expect

var MessageStream = require('../../lib/wire/messagestream')

describe('MessageStream', function() {
  it('should emit complete varint32-delimited chunks', function() {
    var ms = new MessageStream()
    var spy = sinon.spy()
    ms.on('data', spy)
    ms.write(new Buffer([1, 0x61, 2, 0x62, 0x63]))
    expect(spy).to.have.been.calledTwice
    expect(spy.firstCall.args).to.eql([new Buffer([0x61])])
    expect(spy.secondCall.args).to.eql([new Buffer([0x62, 0x63])])
  })

  it('should wait for more data', function() {
    var ms = new MessageStream()
    var spy = sinon.spy()
    ms.on('data', spy)
    ms.write(new Buffer([1]))
    expect(spy).to.not.have.been.called
    ms.write(new Buffer([0x66]))
    expect(spy).to.have.been.calledOnce
    expect(spy.firstCall.args).to.eql([new Buffer([0x66])])
  })

  it('should read varint32 properly', function() {
    var ms = new MessageStream
    var spy = sinon.spy()
    ms.on('data', spy)
    ms.write(new Buffer([172, 2])) // 300
    var data = new Buffer(300)
    data.fill(0)
    ms.write(data)
    expect(spy).to.have.been.calledOnce
    expect(spy.firstCall.args).to.eql([data])
  })

  it('should emit "end"', function(done) {
    var ms = new MessageStream()
    var spy = sinon.spy()
    ms.on('data', sinon.spy())
    ms.on('end', spy)
    ms.write(new Buffer([1]))
    ms.end()
    setImmediate(function() {
      expect(spy).to.have.been.called
      done()
    })
  })
})
