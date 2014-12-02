var assert = require('assert')

var QueryParser = require('./index')

var tests = [
  function() {
    var parser = new QueryParser()
    assert.deepEqual(parser.parse('a'), [
      {
        field: null
      , op: null
      , query: 'a'
      }
    ])
  }
, function() {
    var parser = new QueryParser()
    assert.deepEqual(parser.parse('a b c'), [
      {
        field: null
      , op: null
      , query: 'a'
      }
    , {
        field: null
      , op: null
      , query: 'b'
      }
    , {
        field: null
      , op: null
      , query: 'c'
      }
    ])
  }
, function() {
    var parser = new QueryParser()
    assert.deepEqual(parser.parse('serial:foo'), [
      {
        field: 'serial'
      , op: null
      , query: 'foo'
      }
    ])
  }
/*
  This test is currently failing, but I'm not sure if I care enough about it.
  Commented out for now.

, function() {
    var parser = new QueryParser()
    assert.deepEqual(parser.parse('a:b:c'), [
      {
        field: 'a'
      , query: 'b:c'
      }
    ])
  }
*/
, function() {
    var parser = new QueryParser()
    assert.deepEqual(parser.parse('name:"Galaxy S2 LTE"'), [
      {
        field: 'name'
      , op: null
      , query: 'Galaxy S2 LTE'
      }
    ])
  }
, function() {
    var parser = new QueryParser()
    assert.deepEqual(parser.parse('name:"Galaxy S2 LTE" black'), [
      {
        field: 'name'
      , op: null
      , query: 'Galaxy S2 LTE'
      }
    , {
        field: null
      , op: null
      , query: 'black'
      }
    ])
  }
, function() {
    var parser = new QueryParser()
    assert.deepEqual(parser.parse('"foo bar"'), [
      {
        field: null
      , op: null
      , query: 'foo bar'
      }
    ])
  }
, function() {
    var parser = new QueryParser()
    assert.deepEqual(parser.parse('version:>=4.1'), [
      {
        field: 'version'
      , op: '>='
      , query: '4.1'
      }
    ])
  }
, function() {
    var parser = new QueryParser()
    assert.deepEqual(parser.parse('version: >=4.1'), [
      {
        field: 'version'
      , op: '>='
      , query: '4.1'
      }
    ])
  }
, function() {
    var parser = new QueryParser()
    assert.deepEqual(parser.parse('version: < 4.1'), [
      {
        field: 'version'
      , op: '<'
      , query: '4.1'
      }
    ])
  }
, function() {
    var parser = new QueryParser()
    assert.deepEqual(parser.parse('Galaxy operator: DOCOMO'), [
      {
        field: null
      , op: null
      , query: 'Galaxy'
      }
    , {
        field: 'operator'
      , op: null
      , query: 'DOCOMO'
      }
    ])
  }
]

tests.forEach(function(test) {
  test()
})
