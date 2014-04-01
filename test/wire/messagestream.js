var sinon = require('sinon')
var chai = require('chai')
chai.use(require('sinon-chai'))
var expect = chai.expect

var ms = require('../../lib/wire/messagestream')

describe('MessageStream', function() {
  describe('DelimitedStream', function() {
    it('should emit complete varint-delimited chunks', function() {
      var ds = new ms.DelimitedStream()
      var spy = sinon.spy()
      ds.on('data', spy)
      ds.write(new Buffer([1, 0x61, 2, 0x62, 0x63]))
      expect(spy).to.have.been.calledTwice
      expect(spy.firstCall.args).to.eql([new Buffer([0x61])])
      expect(spy.secondCall.args).to.eql([new Buffer([0x62, 0x63])])
    })

    it('should wait for more data', function() {
      var ds = new ms.DelimitedStream()
      var spy = sinon.spy()
      ds.on('data', spy)
      ds.write(new Buffer([3]))
      expect(spy).to.not.have.been.called
      ds.write(new Buffer([0x66]))
      expect(spy).to.not.have.been.called
      ds.write(new Buffer([0x65]))
      expect(spy).to.not.have.been.called
      ds.write(new Buffer([0x64]))
      expect(spy).to.have.been.calledOnce
      expect(spy.firstCall.args).to.eql([new Buffer([0x66, 0x65, 0x64])])
    })

    it('should read varint32 properly', function() {
      var ds = new ms.DelimitedStream()
      var spy = sinon.spy()
      ds.on('data', spy)
      ds.write(new Buffer([172, 2])) // 300
      var data = new Buffer(300)
      data.fill(0)
      ds.write(data)
      expect(spy).to.have.been.calledOnce
      expect(spy.firstCall.args).to.eql([data])
    })

    it('should emit "end"', function(done) {
      var ds = new ms.DelimitedStream()
      var spy = sinon.spy()
      ds.on('data', sinon.spy())
      ds.on('end', spy)
      ds.write(new Buffer([1]))
      ds.end()
      setImmediate(function() {
        expect(spy).to.have.been.called
        done()
      })
    })
  })

  describe('DelimitingStream', function() {
    it('should add delimiter chunks to stream', function() {
      var ds = new ms.DelimitingStream()
      var spy = sinon.spy()
      ds.on('data', spy)
      ds.write(new Buffer([0x66, 0x6f, 0x6f]))
      expect(spy).to.have.been.calledTwice
      expect(spy.firstCall.args).to.eql([new Buffer([0x03])])
      expect(spy.secondCall.args).to.eql([new Buffer([0x66, 0x6f, 0x6f])])
    })

    it('should write proper varints', function() {
      var ds = new ms.DelimitingStream()
      var spy = sinon.spy()
      ds.on('data', spy)
      var data = new Buffer(300)
      data.fill(0)
      ds.write(data)
      expect(spy).to.have.been.calledTwice
      expect(spy.firstCall.args).to.eql([new Buffer([172, 2])])
      expect(spy.secondCall.args).to.eql([data])
    })

    it('should emit "end"', function(done) {
      var ds = new ms.DelimitingStream()
      var spy = sinon.spy()
      ds.on('data', sinon.spy())
      ds.on('end', spy)
      ds.write(new Buffer([1]))
      ds.end()
      setImmediate(function() {
        expect(spy).to.have.been.called
        done()
      })
    })
  })
})
