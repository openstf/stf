var jwtutil = require('../util/jwtutil')
var urlutil = require('../util/urlutil')

module.exports = function(options) {
  return function(req, res, next) {
    if (req.query.jwt) {
      // Coming from auth client
      var data = jwtutil.decode(req.query.jwt, options.secret)
        , redir = urlutil.removeParam(req.url, 'jwt')
      if (data) {
        // Redirect once to get rid of the token
        req.session.jwt = data
        res.redirect(redir)
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
