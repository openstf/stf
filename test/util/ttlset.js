var chai = require('chai')
var expect = chai.expect

var TtlSet = require('../../lib/util/ttlset')

describe('TtlSet', function() {

  describe('bump', function() {

    it('should create an item for the value if none exists', function(done) {
      var ttlset = new TtlSet(5000)
      ttlset.bump(5)
      expect(ttlset.head).to.equal(ttlset.tail)
      expect(ttlset.head.value).to.equal(5)
      done()
    })

    it('should make the item the new tail', function(done) {
      var ttlset = new TtlSet(5000)
      ttlset.bump(5)
      expect(ttlset.tail.value).to.equal(5)
      ttlset.bump(6)
      expect(ttlset.tail.value).to.equal(6)
      done()
    })

    it('should set head if none exists', function(done) {
      var ttlset = new TtlSet(5000)
      expect(ttlset.head).to.be.null
      ttlset.bump(5)
      expect(ttlset.head.value).to.equal(5)
      ttlset.bump(6)
      expect(ttlset.head.value).to.equal(5)
      done()
    })

    it('should take old item out and make it the tail', function(done) {
      var ttlset = new TtlSet(5000)
      ttlset.bump(1)
      expect(ttlset.head.value).to.equal(1)
      expect(ttlset.tail.value).to.equal(1)
      expect(ttlset.head.next).to.be.null
      expect(ttlset.head.prev).to.be.null
      expect(ttlset.tail.next).to.be.null
      expect(ttlset.tail.prev).to.be.null
      ttlset.bump(2)
      expect(ttlset.head.value).to.equal(1)
      expect(ttlset.tail.value).to.equal(2)
      expect(ttlset.head.next).to.equal(ttlset.tail)
      expect(ttlset.head.prev).to.be.null
      expect(ttlset.tail.next).to.be.null
      expect(ttlset.tail.prev).to.equal(ttlset.head)
      ttlset.bump(1)
      expect(ttlset.head.value).to.equal(2)
      expect(ttlset.tail.value).to.equal(1)
      expect(ttlset.head.next).to.equal(ttlset.tail)
      expect(ttlset.head.prev).to.be.null
      expect(ttlset.tail.next).to.be.null
      expect(ttlset.tail.prev).to.equal(ttlset.head)
      ttlset.bump(1)
      expect(ttlset.head.value).to.equal(2)
      expect(ttlset.tail.value).to.equal(1)
      expect(ttlset.head.next).to.equal(ttlset.tail)
      expect(ttlset.head.prev).to.be.null
      expect(ttlset.tail.next).to.be.null
      expect(ttlset.tail.prev).to.equal(ttlset.head)
      done()
    })

  })

  describe('drop', function() {

    it('should silently ignore unknown values', function(done) {
      var ttlset = new TtlSet(5000)
      ttlset.drop(5)
      done()
    })

    it('should remove the value from the set', function(done) {
      var ttlset = new TtlSet(5000)
      ttlset.bump(5)
      ttlset.drop(5)
      expect(ttlset.tail).to.be.null
      expect(ttlset.head).to.be.null
      ttlset.bump(1)
      ttlset.bump(2)
      ttlset.drop(1)
      expect(ttlset.tail).to.equal(ttlset.head)
      expect(ttlset.tail.value).to.equal(2)
      ttlset.bump(3)
      ttlset.drop(3)
      expect(ttlset.tail).to.equal(ttlset.head)
      expect(ttlset.tail.value).to.equal(2)
      done()
    })

  })

})
