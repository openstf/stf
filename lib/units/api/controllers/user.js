var Promise = require('bluebird')

var dbapi = require('../../../db/api')
var logger = require('../../../util/logger')
var datautil = require('../../../util/datautil')

var log = logger.createLogger('api:controllers:user')

module.exports = {
  getCurrentUser: getCurrentUser
, getCurrentUserGroup: getCurrentUserGroup
}

function getCurrentUser(req, res) {
  res.json({
    success: true
  , user: req.user
  })
}

function getCurrentUserGroup(req, res) {
  dbapi.loadGroup(req.user.email)
    .then(function(cursor) {
      return Promise.promisify(cursor.toArray, cursor)()
        .then(function(list) {
          list.forEach(function(device) {
            datautil.normalize(device, req.user)
          })
          res.json({
            success: true
          , devices: list
          })
        })
    })
    .catch(function(err) {
      log.error('Failed to load group: ', err.stack)
      res.json(500, {
        success: false
      })
    })
}
