var url = require('url')

var express = require('express')
var validator = require('express-validator')

var logger = require('../../util/logger')
var requtil = require('../../util/requtil')
var ldaputil = require('../../util/ldaputil')
var jwtutil = require('../../util/jwtutil')

module.exports = function(options) {
  var log = logger.createLogger('auth-ldap')
    , app = express()

  app.use(express.cookieParser())
  app.use(express.cookieSession({
    secret: options.secret
  , key: options.ssid
  }))
  app.use(express.json())
  app.use(express.urlencoded())
  app.use(validator())

  app.get('/auth', function(req, res) {
    res.locals.csrf = req.csrfToken()
  })

  app.post('/auth', function(req, res) {
    var log = logger.createLogger('auth-ldap')
    log.setLocalIdentifier(req.ip)
    switch (req.accepts(['json'])) {
      case 'json':
        requtil.validate(req, function() {
            req.checkBody('username').notEmpty()
            req.checkBody('password').notEmpty()

            // This is a security risk. Someone might forward the user
            // to the login page with their own redirect set, and they'd
            // then be able to steal the token. Some kind of a whitelist
            // or a fixed redirect URL is needed.
            req.checkBody('redirect').isUrl()
          })
          .then(function() {
            return ldaputil.login(
              options.ldap
            , req.body.username
            , req.body.password
            )
          })
          .then(function(user) {
            log.info('Authenticated "%s"', ldaputil.email(user))
            var token = jwtutil.encode({
              payload: {
                email: ldaputil.email(user)
              , name: user.cn
              }
            , secret: options.secret
            })
            var target = url.parse(req.body.redirect)
            target.query = {
              jwt: token
            }
            res.status(200)
              .json({
                success: true
              , redirect: url.format(target)
              })
          })
          .catch(requtil.ValidationError, function(err) {
            res.status(400)
              .json({
                success: false
              , error: 'ValidationError'
              , validationErrors: err.errors
              })
          })
          .catch(ldaputil.InvalidCredentialsError, function(err) {
            log.warn('Authentication failure for "%s"', err.user)
            res.status(400)
              .json({
                success: false
              , error: 'InvalidCredentialsError'
              })
          })
          .catch(function(err) {
            log.error('Unexpected error', err.stack)
            res.status(500)
              .json({
                success: false
              , error: 'ServerError'
              })
          })
        break
      default:
        res.send(406)
        break
    }
  })

  app.listen(options.port)
  log.info('Listening on port %d', options.port)
}
