var assert = require('assert')

var QueryParser = require('./query-parser')

var tests = [
  function() {
    var parser = new QueryParser()
    assert.deepEqual(parser.parse('a'), [
      {
        field: null
      , query: 'a'
      }
    ])
  }
, function() {
    var parser = new QueryParser()
    assert.deepEqual(parser.parse('a b c'), [
      {
        field: null
      , query: 'a'
      }
    , {
        field: null
      , query: 'b'
      }
    , {
        field: null
      , query: 'c'
      }
    ])
  }
, function() {
    var parser = new QueryParser()
    assert.deepEqual(parser.parse('serial:foo'), [
      {
        field: 'serial'
      , query: 'foo'
      }
    ])
  }
, function() {
    var parser = new QueryParser()
    assert.deepEqual(parser.parse('name:"Galaxy S2 LTE"'), [
      {
        field: 'name'
      , query: 'Galaxy S2 LTE'
      }
    ])
  }
, function() {
    var parser = new QueryParser()
    assert.deepEqual(parser.parse('name:"Galaxy S2 LTE" black'), [
      {
        field: 'name'
      , query: 'Galaxy S2 LTE'
      }
    , {
        field: null
      , query: 'black'
      }
    ])
  }
, function() {
    var parser = new QueryParser()
    assert.deepEqual(parser.parse('"foo bar"'), [
      {
        field: null
      , query: 'foo bar'
      }
    ])
  }
, function() {
    var parser = new QueryParser()
    assert.deepEqual(parser.parse('version:>=4.1'), [
      {
        field: 'version'
      , query: '>=4.1'
      }
    ])
  }
, function() {
    var parser = new QueryParser()
    assert.deepEqual(parser.parse('version: >=4.1'), [
      {
        field: 'version'
      , query: '>=4.1'
      }
    ])
  }
, function() {
    var parser = new QueryParser()
    assert.deepEqual(parser.parse('Galaxy operator: DOCOMO'), [
      {
        field: null
      , query: 'Galaxy'
      }
    , {
        field: 'operator'
      , query: 'DOCOMO'
      }
    ])
  }
]

tests.forEach(function(test) {
  test()
})
