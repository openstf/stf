var http = require('http')

var express = require('express')
var passport = require('passport')

var logger = require('../../../util/logger')
var urlutil = require('../../../util/urlutil')
var jwtutil = require('../../../util/jwtutil')
var Strategy = require('./strategy')

module.exports = function(options) {
  var log = logger.createLogger('auth-oauth2')
  var app = express()
  var server = http.createServer(app)

  app.set('strict routing', true)
  app.set('case sensitive routing', true)

  function verify(accessToken, refreshToken, profile, done) {
    done(null, profile)
  }

  passport.use(new Strategy(options.oauth, verify))

  app.use(passport.initialize())
  app.use(passport.authenticate('oauth2', {
    failureRedirect: '/auth/oauth/'
  , session: false
  }))

  function isEmailAllowed(email) {
    if (email) {
      if (options.domain) {
        return email.endsWith(options.domain)
      }
      return true
    }
    return false
  }

  app.get(
    '/auth/oauth/callback'
  , function(req, res) {
      if (isEmailAllowed(req.user.email)) {
        res.redirect(urlutil.addParams(options.appUrl, {
          jwt: jwtutil.encode({
            payload: {
              email: req.user.email
            , name: req.user.email.split('@', 1).join('')
            }
          , secret: options.secret
          , header: {
              exp: Date.now() + 24 * 3600
            }
          })
        }))
      }
      else {
        log.warn('Missing or disallowed email in profile', req.user)
        res.send('<html><body>Missing or rejected email address ' +
                 '<a href="/auth/oauth/">Retry</a></body></html>')
      }
    }
  )

  server.listen(options.port)
  log.info('Listening on port %d', options.port)
}
