var jwtutil = require('../../../util/jwtutil')
var urlutil = require('../../../util/urlutil')
var logger = require('../../../util/logger')
var dbapi = require('../../../db/api')

var log = logger.createLogger('api:helpers:securityHandlers')

module.exports = {
  accessTokenAuth: accessTokenAuth
}

function accessTokenAuth(req, res, next) {
  if (req.headers.authorization) {
    var tokenId = req.headers.authorization.split(" ")[1]

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
              res.json(500, {
                success: false
              })
            }
          })
        .catch(function(err) {
          log.error('Failed to load token: ', err.stack)
          res.json(401, {
            success: false,
            description: 'Bad credentials'
          })
        })
    } else {
      log.error('Bad Access Token Header')
      res.json(401, {
        success: false,
        description: 'Bad credentials'
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
    res.json(401, {
      success: false,
      description: 'Requires authentication'
    })
  }
}
