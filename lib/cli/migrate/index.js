/**
* Copyright © 2019 contains code contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

module.exports.command = 'migrate'

module.exports.describe = 'Migrates the database to the latest version.'

module.exports.builder = function(yargs) {
  return yargs
}

module.exports.handler = function() {
  var logger = require('../../util/logger')
  var log = logger.createLogger('cli:migrate')
  var db = require('../../db')
  var dbapi = require('../../db/api')
  const apiutil = require('../../util/apiutil')
  const Promise = require('bluebird')

  return db.setup()
    .then(function() {
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          return dbapi.getGroupByIndex(apiutil.ROOT, 'privilege').then(function(group) {
            if (!group) {
              const env = {
                STF_ROOT_GROUP_NAME: 'Common'
              , STF_ADMIN_NAME: 'administrator'
              , STF_ADMIN_EMAIL: 'administrator@fakedomain.com'
              }
              for (const i in env) {
                if (process.env[i]) {
                  env[i] = process.env[i]
                }
              }
              return dbapi.createBootStrap(env)
            }
            return group
          })
          .then(function() {
            resolve(true)
          })
          .catch(function(err) {
            reject(err)
          })
        }, 1000)
      })
    })
    .catch(function(err) {
      log.fatal('Migration had an error:', err.stack)
      process.exit(1)
    })
    .finally(function() {
      process.exit(0)
    })
}
