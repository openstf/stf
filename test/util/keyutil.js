var path = require('path')
var fs = require('fs')

var chai = require('chai')
var expect = chai.expect

var keyutil = require('../../lib/util/keyutil')

describe('keyutil', function() {
  describe('parseKeyCharacterMap', function() {
    it('should be able to parse Virtual.kcm', function(done) {
      var expected = require('../fixt/Virtual.kcm.json')
      var source = path.join(__dirname, '..', 'fixt', 'Virtual.kcm')

      keyutil.parseKeyCharacterMap(fs.createReadStream(source))
        .then(function(keymap) {
          expect(keymap).to.eql(expected)
          done()
        })
        .catch(done)
    })
  })
})
