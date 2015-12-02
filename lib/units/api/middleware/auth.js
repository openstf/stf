var jwtutil = require('../../../util/jwtutil')
var urlutil = require('../../../util/urlutil')
var logger = require('../../../util/logger')
var dbapi = require('../../../db/api')

module.exports = function(options) {
  return function(req, res, next) {

    var log = logger.createLogger('api:auth')

    if (req.headers.authorization) {
      var tokenId = req.headers.authorization.split(" ")[1]

      if (tokenId) {
        dbapi.loadAccessToken(tokenId)
          .then(function(token) {
            var jwt = token.jwt
              , data = jwtutil.decode(jwt, options.secret)

            if (data) {
              dbapi.loadUser(data.email)
                .then(function(user) {
                  if (user) {
                    req.user = user
                    next()
                  }
                })
              }
            })
          .catch(function(err) {
            log.error('Failed to load token: ', err.stack)
            res.json(500, {
              success: false,
              description: "Bad Access Token"
            })
          })
      } else {
        log.error("Bad Access Token")
        res.json(500, {
          success: false,
          description: "Bad Access Token Header"
        })
      }
    }
    // TODO: Remove this once frontend become stateless
    else if (req.session && req.session.jwt) {
      dbapi.loadUser(req.session.jwt.email)
        .then(function(user) {
          if (user) {
            req.user = user
            next()
          }
          else {
            // We no longer have the user in the database
            res.redirect(options.authUrl)
          }
        })
        .catch(next)
    }
    else {
      // No session, forward to auth client
     res.redirect(options.authUrl)
    }
  }
}
