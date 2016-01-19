/* eslint no-console: 0 */

var assert = require('assert')

var patchArray = require('./patch-array')

var tests = [
  {
    a: ['a', 'b', 'c', 'd', 'e']
  , b: ['a', 'e', 'c', 'd', 'b']
  , ops: [
      ['swap', 4, 1]
    ]
  }
, {
    a: ['a', 'b', 'c', 'd', 'e']
  , b: ['e', 'd', 'c', 'b', 'a']
  , ops: [
      ['swap', 4, 0]
    , ['swap', 3, 1]
    ]
  }
, {
    a: ['a', 'b', 'c', 'd', 'e', 'f']
  , b: ['f', 'e', 'd', 'c', 'b', 'a']
  , ops: [
      ['swap', 5, 0]
    , ['swap', 4, 1]
    , ['swap', 3, 2]
    ]
  }
, {
    a: ['a', 'b', 'c', 'd', 'e', 'f']
  , b: ['f', 'e']
  , ops: [
      ['remove', 0]
    , ['remove', 0]
    , ['remove', 0]
    , ['remove', 0]
    , ['swap', 1, 0]
    ]
  }
, {
    a: ['a', 'b', 'c', 'd', 'e', 'f']
  , b: ['f', 'a']
  , ops: [
      ['remove', 1]
    , ['remove', 1]
    , ['remove', 1]
    , ['remove', 1]
    , ['swap', 1, 0]
    ]
  }
, {
    a: []
  , b: ['a', 'b', 'c', 'd', 'e', 'f']
  , ops: [
      ['insert', 0, 'a']
    , ['insert', 1, 'b']
    , ['insert', 2, 'c']
    , ['insert', 3, 'd']
    , ['insert', 4, 'e']
    , ['insert', 5, 'f']
    ]
  }
, {
    a: ['a', 'd']
  , b: ['a', 'b', 'c', 'd', 'e', 'f']
  , ops: [
      ['insert', 1, 'b']
    , ['insert', 2, 'c']
    , ['insert', 4, 'e']
    , ['insert', 5, 'f']
    ]
  }
, {
    a: ['b', 'd', 'a']
  , b: ['a', 'b', 'c', 'd', 'e', 'f']
  , ops: [
      ['swap', 2, 0]
    , ['swap', 2, 1]
    , ['insert', 2, 'c']
    , ['insert', 4, 'e']
    , ['insert', 5, 'f']
    ]
  }
]

function verify(a, b, ops) {
  var c = [].concat(a)
  ops.forEach(function(op) {
    switch (op[0]) {
    case 'swap':
      var temp = c[op[1]]
      c[op[1]] = c[op[2]]
      c[op[2]] = temp
      break
    case 'move':
      c.splice(op[2] + 1, 0, c[op[1]])
      c.splice(op[1], 1)
      break
    case 'insert':
      c.splice(op[1], 0, op[2])
      break
    case 'remove':
      c.splice(op[1], 1)
      break
    default:
      throw new Error('Unknown op ' + op[0])
    }
  })
  assert.deepEqual(c, b)
}

tests.forEach(function(test) {
  console.log('Running test:')
  console.log('  <- ', test.a)
  console.log('  -> ', test.b)
  console.log('Verifying test expectations')
  verify(test.a, test.b, test.ops)
  console.log('Verifying patchArray')
  var patch = patchArray(test.a, test.b)
  console.log(' patch', patch)
  verify(test.a, test.b, patch)
})
