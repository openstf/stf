var fs = require('fs')
var http = require('http')

var express = require('express')
var passport = require('passport')
var SamlStrategy = require('passport-saml').Strategy
var bodyParser = require('body-parser')
var _ = require('lodash')

var logger = require('../../util/logger')
var urlutil = require('../../util/urlutil')
var jwtutil = require('../../util/jwtutil')

module.exports = function(options) {
  var log = logger.createLogger('auth-saml2')
  var app = express()
  var server = http.createServer(app)

  app.set('strict routing', true)
  app.set('case sensitive routing', true)
  app.use(bodyParser.urlencoded({extended: false}))
  app.use(passport.initialize())

  passport.serializeUser(function(user, done) {
    done(null, user)
  })
  passport.deserializeUser(function(user, done) {
    done(null, user)
  })

  var verify = function(profile, done) {
    return done(null, profile)
  }

  var samlConfig = {
    path: '/auth/saml/callback'
  , entryPoint: options.saml.entryPoint
  , issuer: options.saml.issuer
  }

  if (options.saml.certPath) {
    samlConfig = _.merge(samlConfig, {
      cert: fs.readFileSync(options.saml.certPath).toString()
    })
  }

  passport.use(new SamlStrategy(samlConfig, verify))

  app.use(passport.authenticate('saml', {
    failureRedirect: '/auth/saml/'
  , session: false
  }))

  app.post(
    '/auth/saml/callback'
  , function(req, res) {
      if (req.user.email) {
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
        log.warn('Missing email in profile', req.user)
        res.redirect('/auth/saml/')
      }
    }
  )

  server.listen(options.port)
  log.info('Listening on port %d', options.port)
}
