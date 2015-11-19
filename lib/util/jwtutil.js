var assert = require('assert')
var jws = require('jws')

module.exports.encode = function(options) {
  assert.ok(options.payload, 'payload required')
  assert.ok(options.secret, 'secret required')

  var expiry = options.expiry || Date.now() + 24 * 3600

  return jws.sign({
    header: {
      alg: 'HS256'
    , exp: expiry
    }
  , payload: options.payload
  , secret: options.secret
  })
}

module.exports.decode = function(payload, secret) {
  if (!jws.verify(payload, 'HS256', secret)) {
    return null
  }

  var decoded = jws.decode(payload, {
        json: true
      })
    , exp = decoded.header.exp

  if (exp && exp <= Date.now()) {
    return null
  }

  return decoded.payload
}
