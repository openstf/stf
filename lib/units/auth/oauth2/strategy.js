var util = require('util')

var oauth2 = require('passport-oauth2')

function Strategy(options, verify) {
  oauth2.Strategy.call(this, options, verify)
  if (!options.authorizationURL) {
    throw new TypeError('OAuth2Strategy requires a userinfoURL option')
  }
  this._userinfoURL = options.userinfoURL
  this._oauth2.useAuthorizationHeaderforGET(true)
}

util.inherits(Strategy, oauth2.Strategy)

Strategy.prototype.userProfile = function(accessToken, callback) {
  this._oauth2.get(this._userinfoURL, accessToken, function(err, data) {
    if (err) {
      return callback(err)
    }

    try {
      return callback(null, JSON.parse(data))
    }
    catch (err) {
      return callback(err)
    }
  })
}

module.exports = Strategy
