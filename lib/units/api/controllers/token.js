var Promise = require('bluebird')

var dbapi = require('../../../db/api')
var logger = require('../../../util/logger')

var log = logger.createLogger('api:controllers:token')

module.exports = {
  getAccessTokens: getAccessTokens
}

function getAccessTokens(req, res) {
  dbapi.loadAccessTokens(req.user.email)
    .then(function(cursor) {
      return Promise.promisify(cursor.toArray, cursor)()
        .then(function(list) {
          var titles = []
          list.forEach(function(token) {
            titles.push(token.title)
          })
          res.json({
            success: true
          , titles: titles
          })
        })
    })
    .catch(function(err) {
      log.error('Failed to load tokens: ', err.stack)
      res.json(500, {
        success: false
      })
    })
}
