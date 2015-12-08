var dbapi = require('../../../db/api')
var jwtutil = require('../../../util/jwtutil')
var urlutil = require('../../../util/urlutil')
var logger = require('../../../util/logger')

var log = logger.createLogger('api:helpers:securityHandlers')

module.exports = {
  accessTokenAuth: accessTokenAuth
}

function accessTokenAuth(req, res, next) {
  if (req.headers.authorization) {
    var authHeader = req.headers.authorization.split(' ')
      , format = authHeader[0]
      , tokenId = authHeader[1]

    if (format !== 'bearer') {
      res.status(401).json({
        success: false
      , description: 'Authorization header should be in "bearer $AUTH_TOKEN" format'
      })
    }

    if (tokenId) {
      dbapi.loadAccessToken(tokenId)
        .then(function(token) {
          var jwt = token.jwt
            , data = jwtutil.decode(jwt, req.options.secret)

          if (data) {
            dbapi.loadUser(data.email)
              .then(function(user) {
                if (user) {
                  req.user = user
                  next()
                }
              })
            } else {
              res.status(500).json({
                success: false
              })
            }
          })
        .catch(function(err) {
          log.error('Failed to load token: ', err.stack)
          res.status(401).json({
            success: false,
            description: 'Bad Credentials'
          })
        })
    } else {
      log.error('Bad Access Token Header')
      res.status(401).json({
        success: false,
        description: 'Bad Credentials'
      })
    }
  }
  // Request is coming from browser app
  // TODO: Remove this once frontend become stateless
  //       and start sending request without session
  else if (req.session && req.session.jwt) {
    dbapi.loadUser(req.session.jwt.email)
      .then(function(user) {
        if (user) {
          req.user = user
          next()
        }
        else {
          res.json(500, {
            success: false
          })
        }
      })
      .catch(next)
  }
  else {
    res.status(401).json({
      success: false,
      description: 'Requires Authentication'
    })
  }
}
