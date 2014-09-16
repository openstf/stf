var sinon = require('sinon')
var chai = require('chai')
chai.use(require('sinon-chai'))
var expect = chai.expect

var SeqQueue = require('../../lib/wire/seqqueue')

describe('SeqQueue', function() {
  it('should wait until started', function() {
    var spy = sinon.spy()
    var q = new SeqQueue(10, Infinity)
    q.push(1, spy)
    expect(spy).to.not.have.been.called
    q.start(0)
    expect(spy).to.have.been.calledOnce
  })

  it('should call first item immediately if started', function() {
    var spy = sinon.spy()
    var q = new SeqQueue(10, Infinity)
    q.start(0)
    q.push(1, spy)
    expect(spy).to.have.been.calledOnce
  })

  it('should call items in seq order', function() {
    var spy1 = sinon.spy()
    var spy2 = sinon.spy()
    var spy3 = sinon.spy()
    var spy4 = sinon.spy()
    var q = new SeqQueue(10, Infinity)
    q.start(0)
    q.push(1, spy1)
    q.push(2, spy2)
    q.push(3, spy3)
    q.push(4, spy4)
    expect(spy1).to.have.been.calledOnce
    expect(spy2).to.have.been.calledOnce
    expect(spy3).to.have.been.calledOnce
    expect(spy4).to.have.been.calledOnce
  })

  it('should not call item until seq reaches it', function() {
    var spy1 = sinon.spy()
    var spy2 = sinon.spy()
    var spy3 = sinon.spy()
    var spy4 = sinon.spy()
    var q = new SeqQueue(10, Infinity)
    q.start(0)
    q.push(1, spy1)
    q.push(4, spy4)
    expect(spy1).to.have.been.calledOnce
    expect(spy4).to.not.have.been.called
    q.push(3, spy3)
    expect(spy3).to.not.have.been.called
    expect(spy4).to.not.have.been.called
    q.push(2, spy2)
    expect(spy2).to.have.been.calledOnce
    expect(spy3).to.have.been.calledOnce
    expect(spy4).to.have.been.calledOnce
  })

  it('should should start skipping items if too far behind', function() {
    var spy1 = sinon.spy()
    var spy2 = sinon.spy()
    var spy3 = sinon.spy()
    var spy4 = sinon.spy()
    var q = new SeqQueue(10, 2)
    q.start(0)
    q.push(1, spy1)
    q.push(3, spy3)
    q.push(4, spy4)
    q.push(2, spy2)
    expect(spy1).to.have.been.calledOnce
    expect(spy2).to.not.have.been.called
    expect(spy3).to.have.been.calledOnce
    expect(spy4).to.have.been.calledOnce
  })

  it('should should start a new queue', function() {
    var spy1 = sinon.spy()
    var spy2 = sinon.spy()
    var spy3 = sinon.spy()
    var spy4 = sinon.spy()
    var q = new SeqQueue(10, Infinity)
    q.start(0)
    q.push(1, spy1)
    q.push(2, spy2)
    q.stop(3)
    q.start(0)
    q.push(1, spy3)
    q.push(2, spy4)
    expect(spy1).to.have.been.calledOnce
    expect(spy2).to.have.been.calledOnce
    expect(spy3).to.have.been.calledOnce
    expect(spy4).to.have.been.calledOnce
  })

  it('should should start a new queue on even on 1 length', function() {
    var spy1 = sinon.spy()
    var spy2 = sinon.spy()
    var spy3 = sinon.spy()
    var q = new SeqQueue(2, Infinity)
    q.start(0)
    q.push(1, spy1)
    q.stop(2)
    q.start(0)
    q.push(1, spy2)
    q.stop(2)
    q.start(0)
    q.push(1, spy3)
    expect(spy1).to.have.been.calledOnce
    expect(spy2).to.have.been.calledOnce
    expect(spy3).to.have.been.calledOnce
  })
})
