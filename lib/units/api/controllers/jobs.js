var util = require('util')

var _ = require('lodash')
var Promise = require('bluebird')
var dbapi = require('../../../db/api')
var logger = require('../../../util/logger')

var log = logger.createLogger('api:controllers:jobs')

module.exports = {
  getUserJobs: getUserJobs
, getJobErrorMessage: getJobErrorMessage
}

function getUserJobs(req, res) {
  dbapi.loadUserJobs(req.user.email)
    .then(function(cursor) {
      return Promise.promisify(cursor.toArray, cursor)()
        .then(function(list) {
          res.json({
            success: true
            , jobs: list
          })
        })
    })
    .catch(function(err) {
      log.error('Failed to load jobs: ', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function getJobErrorMessage(req, res) {
  var storageId = req.swagger.params.storageId.value
  dbapi.loadUserJobErrorMessage(storageId).then(function(error) {
      res.json({
        success: true
        , error: error
      })
    })
    .catch(function(err) {
      log.error('Failed to load error message: ', err.stack)
      res.status(500).json({
        success: false
      })
    })
}
