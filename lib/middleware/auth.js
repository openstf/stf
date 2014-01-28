var jwtutil = require('../util/jwtutil')
var urlutil = require('../util/urlutil')

var dbapi = require('../db/api')

module.exports = function(options) {
  return function(req, res, next) {
    if (req.query.jwt) {
      // Coming from auth client
      var data = jwtutil.decode(req.query.jwt, options.secret)
        , redir = urlutil.removeParam(req.url, 'jwt')
      if (data) {
        // Redirect once to get rid of the token
        dbapi.saveUserAfterLogin(data)
          .then(function() {
            req.session.jwt = data
            res.redirect(redir)
          })
          .catch(next)
      }
      else {
        // Invalid token, forward to auth client
        res.redirect(options.authUrl)
      }
    }
    else if (req.session && req.session.jwt) {
      // Continue existing session
      next()
    }
    else {
      // No session, forward to auth client
      res.redirect(options.authUrl)
    }
  }
}
