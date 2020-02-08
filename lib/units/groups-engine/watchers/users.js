/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

const timeutil = require('../../../util/timeutil')
const r = require('rethinkdb')
const _ = require('lodash')
const logger = require('../../../util/logger')
const wireutil = require('../../../wire/util')
const wire = require('../../../wire')
const db = require('../../../db')

module.exports = function(pushdev) {
  const log = logger.createLogger('watcher-users')

  function sendUserChange(user, isAddedGroup, groups, action, targets) {
    pushdev.send([
      wireutil.global
    , wireutil.envelope(
        new wire.UserChangeMessage(
          user
        , isAddedGroup
        , groups
        , action
        , targets
        , timeutil.now('nano')))
    ])
  }

  db.run(r
    .table('users')
    .pluck(
      'email'
    , 'name'
    , 'privilege'
    , {groups: ['quotas', 'subscribed']
    })
    .changes(), function(err, cursor) {
    if (err) {
      throw err
    }
    return cursor
  })
  .then(function(cursor) {
    cursor.each(function(err, data) {
      if (err) {
        throw err
      }
      if (data.old_val === null) {
        sendUserChange(data.new_val, false, [], 'created', ['settings'])
      }
      else if (data.new_val === null) {
        sendUserChange(data.old_val, false, [], 'deleted', ['settings'])
      }
      else {
        const targets = []

        if (!_.isEqual(
               data.new_val.groups.quotas.allocated
             , data.old_val.groups.quotas.allocated)) {
          targets.push('settings')
          targets.push('view')
        }
        else if (!_.isEqual(
                    data.new_val.groups.quotas.consumed
                  , data.old_val.groups.quotas.consumed)) {
          targets.push('view')
        }
        else if (data.new_val.groups.quotas.defaultGroupsNumber !==
          data.old_val.groups.quotas.defaultGroupsNumber ||
          data.new_val.groups.quotas.defaultGroupsDuration !==
          data.old_val.groups.quotas.defaultGroupsDuration ||
          data.new_val.groups.quotas.defaultGroupsRepetitions !==
          data.old_val.groups.quotas.defaultGroupsRepetitions ||
          data.new_val.groups.quotas.repetitions !==
          data.old_val.groups.quotas.repetitions ||
          !_.isEqual(data.new_val.groups.subscribed, data.old_val.groups.subscribed)) {
          targets.push('settings')
        }
        if (targets.length) {
          sendUserChange(
            data.new_val
          , data.new_val.groups.subscribed.length > data.old_val.groups.subscribed.length
          , _.xor(data.new_val.groups.subscribed, data.old_val.groups.subscribed)
          , 'updated'
          , targets)
        }
      }
    })
  })
  .catch(function(err) {
    log.error('An error occured during USERS table watching', err.stack)
  })
}
