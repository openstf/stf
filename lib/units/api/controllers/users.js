/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

const dbapi = require('../../../db/api')
const _ = require('lodash')
const apiutil = require('../../../util/apiutil')
const lockutil = require('../../../util/lockutil')
const Promise = require('bluebird')
const wire = require('../../../wire')
const wireutil = require('../../../wire/util')
const userapi = require('./user')

/* --------------------------------- PRIVATE FUNCTIONS --------------------------------------- */

function userApiWrapper(fn, req, res) {
  const email = req.swagger.params.email.value

  dbapi.loadUser(email).then(function(user) {
    if (!user) {
      apiutil.respond(res, 404, 'Not Found (user)')
    }
    else {
      req.user = user
      fn(req, res)
    }
  })
  .catch(function(err) {
    apiutil.internalError(res, 'Failed to wrap "%s": ', fn.name, err.stack)
  })
}

function getPublishedUser(user, userEmail, adminEmail, fields) {
  let publishedUser = apiutil.publishUser(user)
  if (userEmail !== adminEmail) {
    publishedUser = _.pick(user, 'email', 'name', 'privilege')
  }
  if (fields) {
    publishedUser = _.pick(publishedUser, fields.split(','))
  }
  return publishedUser
}

function removeUser(email, req, res) {
  const groupOwnerState = req.swagger.params.groupOwner.value
  const anyGroupOwnerState = typeof groupOwnerState === 'undefined'
  const lock = {}

  function removeGroupUser(owner, id) {
    const lock = {}

    return dbapi.lockGroupByOwner(owner, id).then(function(stats) {
      if (!stats.replaced) {
        return apiutil.lightComputeStats(res, stats)
      }
      lock.group = stats.changes[0].new_val

      return owner === email ?
        dbapi.deleteUserGroup(id) :
        dbapi.removeGroupUser(id, email)
    })
    .finally(function() {
      lockutil.unlockGroup(lock)
    })
  }

  function deleteUserInDatabase(channel) {
    return dbapi.removeUserAccessTokens(email).then(function() {
      return dbapi.deleteUser(email).then(function() {
        req.options.pushdev.send([
          channel
        , wireutil.envelope(new wire.DeleteUserMessage(
            email
          ))
        ])
        return 'deleted'
      })
    })
  }

  function computeUserGroupOwnership(groups) {
    if (anyGroupOwnerState) {
      return Promise.resolve(true)
    }
    return Promise.map(groups, function(group) {
      if (!groupOwnerState && group.owner.email === email) {
        return Promise.reject('filtered')
      }
      return !groupOwnerState || group.owner.email === email
    })
    .then(function(results) {
      return _.without(results, false).length > 0
    })
    .catch(function(err) {
      if (err === 'filtered') {
        return false
      }
      throw err
    })
  }

  if (req.user.email === email) {
    return Promise.resolve('forbidden')
  }
  return dbapi.lockUser(email).then(function(stats) {
    if (!stats.replaced) {
      return apiutil.lightComputeStats(res, stats)
    }
    const user = lock.user = stats.changes[0].new_val

    return dbapi.getGroupsByUser(user.email).then(function(groups) {
      return computeUserGroupOwnership(groups).then(function(doContinue) {
        if (!doContinue) {
          return 'unchanged'
        }
        return Promise.each(groups, function(group) {
          return removeGroupUser(group.owner.email, group.id)
        })
        .then(function() {
          return deleteUserInDatabase(user.group)
        })
      })
    })
  })
  .finally(function() {
    lockutil.unlockUser(lock)
  })
}

/* --------------------------------- PUBLIC FUNCTIONS --------------------------------------- */

function getUserInfo(req, email) {
  const fields = req.swagger.params.fields.value

  return dbapi.loadUser(email).then(function(user) {
    if (user) {
      return dbapi.getRootGroup().then(function(group) {
        return getPublishedUser(user, req.user.email, group.owner.email, fields)
      })
    }
    return false
  })
}

function updateUserGroupsQuotas(req, res) {
  const email = req.swagger.params.email.value
  const duration =
    typeof req.swagger.params.duration.value !== 'undefined' ?
      req.swagger.params.duration.value :
      null
  const number =
    typeof req.swagger.params.number.value !== 'undefined' ?
      req.swagger.params.number.value :
      null
  const repetitions =
    typeof req.swagger.params.repetitions.value !== 'undefined' ?
      req.swagger.params.repetitions.value :
      null
  const lock = {}

  lockutil.lockUser(email, res, lock).then(function(lockingSuccessed) {
    if (lockingSuccessed) {
      return dbapi.updateUserGroupsQuotas(email, duration, number, repetitions)
        .then(function(stats) {
          if (stats.replaced) {
            return apiutil.respond(res, 200, 'Updated (user quotas)', {
              user: apiutil.publishUser(stats.changes[0].new_val)
            })
          }
          if ((duration === null || duration === lock.user.groups.quotas.allocated.duration) &&
              (number === null || number === lock.user.groups.quotas.allocated.number) &&
              (repetitions === null || repetitions === lock.user.groups.quotas.repetitions)
             ) {
            return apiutil.respond(res, 200, 'Unchanged (user quotas)', {user: {}})
          }
          return apiutil.respond(
            res
          , 400
          , 'Bad Request (quotas must be >= actual consumed resources)')
        })
    }
    return false
  })
  .catch(function(err) {
    apiutil.internalError(res, 'Failed to update user groups quotas: ', err.stack)
  })
  .finally(function() {
    lockutil.unlockUser(lock)
  })
}

function updateDefaultUserGroupsQuotas(req, res) {
  const duration =
    typeof req.swagger.params.duration.value !== 'undefined' ?
      req.swagger.params.duration.value :
      null
  const number =
    typeof req.swagger.params.number.value !== 'undefined' ?
      req.swagger.params.number.value :
      null
  const repetitions =
    typeof req.swagger.params.repetitions.value !== 'undefined' ?
      req.swagger.params.repetitions.value :
      null
  const lock = {}

  lockutil.lockUser(req.user.email, res, lock).then(function(lockingSuccessed) {
    if (lockingSuccessed) {
      return dbapi.updateDefaultUserGroupsQuotas(req.user.email, duration, number, repetitions)
        .then(function(stats) {
          if (stats.replaced) {
            return apiutil.respond(res, 200, 'Updated (user default quotas)', {
              user: apiutil.publishUser(stats.changes[0].new_val)
            })
          }
          return apiutil.respond(res, 200, 'Unchanged (user default quotas)', {user: {}})
        })
    }
    return false
  })
  .catch(function(err) {
    apiutil.internalError(res, 'Failed to update default user groups quotas: ', err.stack)
  })
  .finally(function() {
    lockutil.unlockUser(lock)
  })
}

function getUserByEmail(req, res) {
  const email = req.swagger.params.email.value

  getUserInfo(req, email).then(function(user) {
    if (user) {
      apiutil.respond(res, 200, 'User Information', {user: user})
    }
    else {
      apiutil.respond(res, 404, 'Not Found (user)')
    }
  })
  .catch(function(err) {
    apiutil.internalError(res, 'Failed to get user: ', err.stack)
  })
}

function getUsers(req, res) {
  const fields = req.swagger.params.fields.value

  dbapi.getUsers().then(function(users) {
    return dbapi.getRootGroup().then(function(group) {
      apiutil.respond(res, 200, 'Users Information', {
        users: users.map(function(user) {
          return getPublishedUser(user, req.user.email, group.owner.email, fields)
        })
      })
    })
  })
  .catch(function(err) {
    apiutil.internalError(res, 'Failed to get users: ', err.stack)
  })
}

function createUser(req, res) {
  const email = req.swagger.params.email.value
  const name = req.swagger.params.name.value

  dbapi.createUser(email, name, req.user.ip).then(function(stats) {
    if (!stats.inserted) {
      apiutil.respond(res, 403, 'Forbidden (user already exists)')
    }
    else {
      apiutil.respond(res, 201, 'Created (user)', {
        user: apiutil.publishUser(stats.changes[0].new_val)
      })
    }
  })
  .catch(function(err) {
    apiutil.internalError(res, 'Failed to create user: ', err.stack)
  })
}

function deleteUsers(req, res) {
  const emails = apiutil.getBodyParameter(req.body, 'emails')
  const target = apiutil.getQueryParameter(req.swagger.params.redirected) ? 'user' : 'users'

  function removeUsers(emails) {
    let results = []

    return Promise.each(emails, function(email) {
      return removeUser(email, req, res).then(function(result) {
        results.push(result)
      })
    })
    .then(function() {
      results = _.without(results, 'unchanged')
      if (!results.length) {
        return apiutil.respond(res, 200, `Unchanged (${target})`)
      }
      results = _.without(results, 'not found')
      if (!results.length) {
        return apiutil.respond(res, 404, `Not Found (${target})`)
      }
      results = _.without(results, 'forbidden')
      if (!results.length) {
        apiutil.respond(res, 403, `Forbidden (${target})`)
      }
      return apiutil.respond(res, 200, `Deleted (${target})`)
    })
    .catch(function(err) {
      if (err !== 'busy') {
        throw err
      }
    })
  }

  (function() {
    if (typeof emails === 'undefined') {
      return dbapi.getEmails().then(function(emails) {
        return removeUsers(emails)
      })
    }
    else {
      return removeUsers(_.without(emails.split(','), ''))
    }
  })()
  .catch(function(err) {
    apiutil.internalError(res, 'Failed to delete ${target}: ', err.stack)
  })
}

function deleteUser(req, res) {
  apiutil.redirectApiWrapper('email', deleteUsers, req, res)
}

function createUserAccessToken(req, res) {
  userApiWrapper(userapi.createAccessToken, req, res)
}

function deleteUserAccessToken(req, res) {
  userApiWrapper(userapi.deleteAccessToken, req, res)
}

function deleteUserAccessTokens(req, res) {
  userApiWrapper(userapi.deleteAccessTokens, req, res)
}

function getUserAccessToken(req, res) {
  userApiWrapper(userapi.getAccessToken, req, res)
}

function getUserAccessTokens(req, res) {
  userApiWrapper(userapi.getAccessTokens, req, res)
}

function getUserDevices(req, res) {
  userApiWrapper(userapi.getUserDevices, req, res)
}

function getUserDevice(req, res) {
  userApiWrapper(userapi.getUserDeviceBySerial, req, res)
}

function addUserDevice(req, res) {
  userApiWrapper(userapi.addUserDevice, req, res)
}

function deleteUserDevice(req, res) {
  userApiWrapper(userapi.deleteUserDeviceBySerial, req, res)
}

function remoteConnectUserDevice(req, res) {
  userApiWrapper(userapi.remoteConnectUserDeviceBySerial, req, res)
}

function remoteDisconnectUserDevice(req, res) {
  userApiWrapper(userapi.remoteDisconnectUserDeviceBySerial, req, res)
}

module.exports = {
    updateUserGroupsQuotas: updateUserGroupsQuotas
  , updateDefaultUserGroupsQuotas: updateDefaultUserGroupsQuotas
  , getUsers: getUsers
  , getUserByEmail: getUserByEmail
  , getUserInfo: getUserInfo
  , createUser: createUser
  , deleteUser: deleteUser
  , deleteUsers: deleteUsers
  , createUserAccessToken: createUserAccessToken
  , deleteUserAccessToken: deleteUserAccessToken
  , deleteUserAccessTokens: deleteUserAccessTokens
  , getUserAccessTokensV2: getUserAccessTokens
  , getUserAccessToken: getUserAccessToken
  , getUserDevicesV2: getUserDevices
  , getUserDevice: getUserDevice
  , addUserDeviceV3: addUserDevice
  , deleteUserDevice: deleteUserDevice
  , remoteConnectUserDevice: remoteConnectUserDevice
  , remoteDisconnectUserDevice: remoteDisconnectUserDevice
}
