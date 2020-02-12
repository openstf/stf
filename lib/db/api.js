/**
* Copyright © 2019 contains code contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

var r = require('rethinkdb')
var util = require('util')

var db = require('./')
var wireutil = require('../wire/util')

var dbapi = Object.create(null)

const uuid = require('uuid')
const apiutil = require('../util/apiutil')
const Promise = require('bluebird')
const _ = require('lodash')

dbapi.DuplicateSecondaryIndexError = function DuplicateSecondaryIndexError() {
  Error.call(this)
  this.name = 'DuplicateSecondaryIndexError'
  Error.captureStackTrace(this, DuplicateSecondaryIndexError)
}

util.inherits(dbapi.DuplicateSecondaryIndexError, Error)

dbapi.close = function(options) {
  return db.close(options)
}

dbapi.unlockBookingObjects = function() {
  return Promise.all([
    db.run(r.table('users').update({groups: {lock: false}}))
  , db.run(r.table('devices').update({group: {lock: false}}))
  , db.run(r.table('groups').update({lock: {admin: false, user: false}}))
  ])
}

dbapi.createBootStrap = function(env) {
  const now = Date.now()

  function updateUsersForMigration(group) {
    return dbapi.getUsers().then(function(users) {
      return Promise.map(users, function(user) {
        return db.run(r.table('users').get(user.email).update({
          privilege: user.email !== group.owner.email ? apiutil.USER : apiutil.ADMIN
        , groups: {
            subscribed: []
          , lock: false
          , quotas: {
              allocated: {
                number: group.envUserGroupsNumber
              , duration: group.envUserGroupsDuration
              }
            , consumed: {
                number: 0
              , duration: 0
              }
            , defaultGroupsNumber: user.email !== group.owner.email ?
                0 :
                group.envUserGroupsNumber
            , defaultGroupsDuration: user.email !== group.owner.email ?
                0 :
                group.envUserGroupsDuration
            , defaultGroupsRepetitions: user.email !== group.owner.email ?
                0 :
                group.envUserGroupsRepetitions
            , repetitions: group.envUserGroupsRepetitions
            }
          }
        }))
        .then(function(stats) {
          if (stats.replaced) {
            return dbapi.addGroupUser(group.id, user.email)
          }
          return stats
        })
      })
    })
  }

  function getDevices() {
    return db.run(r.table('devices'))
      .then(function(cursor) {
        return cursor.toArray()
      })
  }
  
  function updateDevicesForMigration(group) {
    return getDevices().then(function(devices) {
      return Promise.map(devices, function(device) {
        return db.run(r.table('devices').get(device.serial).update({
          group: {
            id: group.id
          , name: group.name
          , lifeTime: group.dates[0]
          , owner: group.owner
          , origin: group.id
          , class: group.class
          , repetitions: group.repetitions
          , originName: group.name
          , lock: false
          }}
        ))
        .then(function(stats) {
          if (stats.replaced) {
            return dbapi.addOriginGroupDevice(group, device.serial)
          }
          return stats
        })
      })
    })
  }

  return dbapi.createGroup({
      name: env.STF_ROOT_GROUP_NAME
    , owner: {
        email: env.STF_ADMIN_EMAIL
      , name: env.STF_ADMIN_NAME
      }
    , users: [env.STF_ADMIN_EMAIL]
    , privilege: apiutil.ROOT
    , class: apiutil.STANDARD
    , repetitions: 0
    , duration: 0
    , isActive: true
    , state: apiutil.READY
    , dates: [{
                start: new Date(now)
              , stop: new Date(now + apiutil.ONE_YEAR)
             }]
    , envUserGroupsNumber: apiutil.MAX_USER_GROUPS_NUMBER
    , envUserGroupsDuration: apiutil.MAX_USER_GROUPS_DURATION
    , envUserGroupsRepetitions: apiutil.MAX_USER_GROUPS_REPETITIONS
    })
    .then(function(group) {
      return dbapi.saveUserAfterLogin({
        name: group.owner.name
      , email: group.owner.email
      , ip: '127.0.0.1'
      })
      .then(function() {
        return updateUsersForMigration(group)
      })
      .then(function() {
        return updateDevicesForMigration(group)
      })
      .then(function() {
        return dbapi.reserveUserGroupInstance(group.owner.email)
      })
    })
}

dbapi.deleteDevice = function(serial) {
  return db.run(r.table('devices').get(serial).delete())
}

dbapi.deleteUser = function(email) {
  return db.run(r.table('users').get(email).delete())
}

dbapi.getReadyGroupsOrderByIndex = function(index) {
  return db
    .run(r.table('groups')
    .orderBy({index: index})
    .filter(function(group) {
      return group('state').ne(apiutil.PENDING)
    }))
    .then(function(cursor) {
      return cursor.toArray()
    })
}

dbapi.getGroupsByIndex = function(value, index) {
  return db.run(r.table('groups').getAll(value, {index: index}))
    .then(function(cursor) {
      return cursor.toArray()
    })
}


dbapi.getGroupByIndex = function(value, index) {
  return dbapi.getGroupsByIndex(value, index)
    .then(function(array) {
      return array[0]
    })
}

dbapi.getGroupsByUser = function(email) {
  return db
    .run(r.table('groups')
    .filter(function(group) {
      return group('users').contains(email)
    }))
    .then(function(cursor) {
      return cursor.toArray()
    })
}

dbapi.getGroup = function(id) {
  return db.run(r.table('groups').get(id))
}

dbapi.getGroups = function() {
  return db.run(r.table('groups'))
    .then(function(cursor) {
      return cursor.toArray()
    })
}

dbapi.getUsers = function() {
  return db.run(r.table('users'))
    .then(function(cursor) {
      return cursor.toArray()
    })
}

dbapi.getEmails = function() {
  return db.run(r.table('users').filter(function(user) {
    return user('privilege').ne(apiutil.ADMIN)
  })
  .getField('email'))
  .then(function(cursor) {
    return cursor.toArray()
  })
}

dbapi.addGroupUser = function(id, email) {
  return Promise.all([
    db.run(r.table('groups')
      .get(id)
      .update({users: r.row('users').setInsert(email)}))
  , db.run(r.table('users')
      .get(email)
      .update({groups: {subscribed: r.row('groups')('subscribed').setInsert(id)}}))
  ])
  .then(function(statss) {
    return statss[0].unchanged ? 'unchanged' : 'added'
  })
}

dbapi.removeGroupUser = function(id, email) {
  return Promise.all([
    db.run(r.table('groups')
      .get(id)
      .update({users: r.row('users').setDifference([email])}))
  , db.run(r.table('users')
      .get(email)
      .update({groups: {subscribed: r.row('groups')('subscribed').setDifference([id])}}))
  ])
  .then(function() {
    return 'deleted'
  })
}

dbapi.lockBookableDevice = function(groups, serial) {
  function wrappedlockBookableDevice() {
    return db.run(r.table('devices').get(serial).update({group: {lock:
      r.branch(
        r.row('group')('lock')
         .eq(false)
         .and(r.row('group')('class')
               .ne(apiutil.STANDARD))
         .and(r.expr(groups)
               .setIntersection([r.row('group')('origin')])
               .isEmpty()
               .not())
      , true
      , r.row('group')('lock'))
    }}, {returnChanges: true}))
    .then(function(stats) {
      return apiutil.lockDeviceResult(stats, dbapi.loadBookableDevice, groups, serial)
    })
  }

  return apiutil.setIntervalWrapper(
    wrappedlockBookableDevice
  , 10
  , Math.random() * 500 + 50)
}

dbapi.lockDeviceByOrigin = function(groups, serial) {
  function wrappedlockDeviceByOrigin() {
    return db.run(r.table('devices').get(serial).update({group: {lock:
      r.branch(
        r.row('group')('lock')
         .eq(false)
         .and(r.expr(groups)
               .setIntersection([r.row('group')('origin')])
               .isEmpty()
               .not())
      , true
      , r.row('group')('lock'))
    }}, {returnChanges: true}))
    .then(function(stats) {
      return apiutil.lockDeviceResult(stats, dbapi.loadDeviceByOrigin, groups, serial)
    })
  }

  return apiutil.setIntervalWrapper(
    wrappedlockDeviceByOrigin
  , 10
  , Math.random() * 500 + 50)
}

dbapi.addOriginGroupDevice = function(group, serial) {
  return db
    .run(r.table('groups')
    .get(group.id)
    .update({devices: r.row('devices').setInsert(serial)}))
    .then(function() {
      return dbapi.getGroup(group.id)
    })
}

dbapi.removeOriginGroupDevice = function(group, serial) {
  return db
    .run(r.table('groups')
    .get(group.id)
    .update({devices: r.row('devices').setDifference([serial])}))
    .then(function() {
      return dbapi.getGroup(group.id)
    })
}

dbapi.addGroupDevices = function(group, serials) {
  const duration = apiutil.computeDuration(group, serials.length)

  return dbapi.updateUserGroupDuration(group.owner.email, group.duration, duration)
    .then(function(stats) {
      if (stats.replaced) {
        return dbapi.updateGroup(
          group.id
        , {
            duration: duration
          , devices: _.union(group.devices, serials)
          })
      }
      return Promise.reject('quota is reached')
    })
}

dbapi.removeGroupDevices = function(group, serials) {
  const duration = apiutil.computeDuration(group, -serials.length)

  return dbapi.updateUserGroupDuration(group.owner.email, group.duration, duration)
    .then(function() {
      return dbapi.updateGroup(
        group.id
      , {
          duration: duration
        , devices: _.difference(group.devices, serials)
        })
    })
}

function setLockOnDevice(serial, state) {
  return db.run(r.table('devices').get(serial).update({group: {lock:
    r.branch(
      r.row('group')('lock').eq(!state)
    , state
    , r.row('group')('lock'))
  }}))
}

dbapi.lockDevice = function(serial) {
  return setLockOnDevice(serial, true)
}

dbapi.unlockDevice = function(serial) {
  return setLockOnDevice(serial, false)
}

function setLockOnUser(email, state) {
  return db.run(r.table('users').get(email).update({groups: {lock:
    r.branch(
      r.row('groups')('lock').eq(!state)
    , state
    , r.row('groups')('lock'))
  }}, {returnChanges: true}))
}

dbapi.lockUser = function(email) {
  function wrappedlockUser() {
    return setLockOnUser(email, true)
      .then(function(stats) {
        return apiutil.lockResult(stats)
      })
  }

  return apiutil.setIntervalWrapper(
    wrappedlockUser
  , 10
  , Math.random() * 500 + 50)
}

dbapi.unlockUser = function(email) {
  return setLockOnUser(email, false)
}

dbapi.lockGroupByOwner = function(email, id) {
  function wrappedlockGroupByOwner() {
    return dbapi.getRootGroup().then(function(group) {
      return db.run(r.table('groups').get(id).update({lock: {user:
        r.branch(
          r.row('lock')('admin')
           .eq(false)
           .and(r.row('lock')('user').eq(false))
           .and(r.row('owner')('email')
                 .eq(email)
                 .or(r.expr(email)
                      .eq(group.owner.email)))
        , true
        , r.row('lock')('user'))
      }}, {returnChanges: true}))
    })
    .then(function(stats) {
      const result = apiutil.lockResult(stats)

      if (!result.status) {
        return dbapi.getGroupAsOwnerOrAdmin(email, id).then(function(group) {
          if (!group) {
            result.data.locked = false
            result.status = true
          }
          return result
        })
      }
      return result
    })
  }

  return apiutil.setIntervalWrapper(
    wrappedlockGroupByOwner
  , 10
  , Math.random() * 500 + 50)
}

dbapi.lockGroup = function(id) {
  function wrappedlockGroup() {
    return db.run(r.table('groups').get(id).update({lock: {user:
      r.branch(
        r.row('lock')('admin')
         .eq(false)
         .and(r.row('lock')('user')
               .eq(false))
      , true
      , r.row('lock')('user'))
    }}))
    .then(function(stats) {
      return apiutil.lockResult(stats)
    })
  }

  return apiutil.setIntervalWrapper(
    wrappedlockGroup
  , 10
  , Math.random() * 500 + 50)
}

dbapi.unlockGroup = function(id) {
  return db.run(r.table('groups').get(id).update({lock: {user: false}}))
}

dbapi.adminLockGroup = function(id, lock) {
  function wrappedAdminLockGroup() {
    return db
      .run(r.table('groups')
      .get(id)
      .update({lock: {user: true, admin: true}}, {returnChanges: true}))
      .then(function(stats) {
        const result = {}

        if (stats.replaced) {
          result.status =
            stats.changes[0].new_val.lock.admin && !stats.changes[0].old_val.lock.user
          if (result.status) {
            result.data = true
            lock.group = stats.changes[0].new_val
          }
        }
        else if (stats.skipped) {
          result.status = true
        }
        return result
      })
  }

  return apiutil.setIntervalWrapper(
    wrappedAdminLockGroup
  , 10
  , Math.random() * 500 + 50)
}

dbapi.adminUnlockGroup = function(lock) {
  if (lock.group) {
    return db
      .run(r.table('groups')
      .get(lock.group.id)
      .update({lock: {user: false, admin: false}}))
  }
  return true
}

dbapi.getRootGroup = function() {
  return dbapi.getGroupByIndex(apiutil.ROOT, 'privilege').then(function(group) {
    if (!group) {
      throw new Error('Root group not found')
    }
    return group
  })
}

dbapi.getUserGroup = function(email, id) {
  return db.run(r.table('groups').getAll(id).filter(function(group) {
    return group('users').contains(email)
  }))
  .then(function(cursor) {
    return cursor.toArray()
  })
  .then(function(groups) {
    return groups[0]
  })
}

dbapi.getUserGroups = function(email) {
  return db
    .run(r.table('groups')
    .filter(function(group) {
      return group('users').contains(email)
    }))
    .then(function(cursor) {
      return cursor.toArray()
    })
}

dbapi.getOnlyUserGroups = function(email) {
  return db
    .run(r.table('groups')
    .filter(function(group) {
      return group('owner')('email')
        .ne(email)
        .and(group('users').contains(email))
    }))
    .then(function(cursor) {
      return cursor.toArray()
    })
}

dbapi.getTransientGroups = function() {
  return db
    .run(r.table('groups')
    .filter(function(group) {
      return group('class')
        .ne(apiutil.BOOKABLE)
        .and(group('class').ne(apiutil.STANDARD))
    }))
    .then(function(cursor) {
      return cursor.toArray()
    })
}

dbapi.getDeviceTransientGroups = function(serial) {
  return db
    .run(r.table('groups')
    .filter(function(group) {
      return group('class')
        .ne(apiutil.BOOKABLE)
        .and(group('class').ne(apiutil.STANDARD))
        .and(group('devices').contains(serial))
    }))
    .then(function(cursor) {
      return cursor.toArray()
    })
}

dbapi.isDeviceBooked = function(serial) {
  return dbapi.getDeviceTransientGroups(serial)
    .then(function(groups) {
      return groups.length > 0
    })
}

dbapi.isRemoveGroupUserAllowed = function(email, targetGroup) {
  if (targetGroup.class !== apiutil.BOOKABLE) {
    return Promise.resolve(true)
  }
  return db.run(
    r.table('groups')
     .getAll(email, {index: 'owner'})
     .filter(function(group) {
       return group('class')
         .ne(apiutil.BOOKABLE)
         .and(group('class').ne(apiutil.STANDARD))
         .and(r.expr(targetGroup.devices)
           .setIntersection(group('devices'))
           .isEmpty()
           .not())
      }))
    .then(function(cursor) {
      return cursor.toArray()
    })
    .then(function(groups) {
      return groups.length === 0
    })
}

dbapi.isUpdateDeviceOriginGroupAllowed = function(serial, targetGroup) {
  return dbapi.getDeviceTransientGroups(serial)
    .then(function(groups) {
      if (groups.length) {
        if (targetGroup.class === apiutil.STANDARD) {
          return false
        }
        for (const group of groups) {
          if (targetGroup.users.indexOf(group.owner.email) < 0) {
            return false
          }
        }
      }
      return true
    })
}

dbapi.getDeviceGroups = function(serial) {
  return db
    .run(r.table('groups')
    .filter(function(group) {
      return group('devices').contains(serial)
    }))
    .then(function(cursor) {
      return cursor.toArray()
    })
}

dbapi.getGroupAsOwnerOrAdmin = function(email, id) {
  return dbapi.getGroup(id).then(function(group) {
    if (group) {
      if (email === group.owner.email) {
        return group
      }
      return dbapi.loadUser(email).then(function(user) {
        if (user && user.privilege === apiutil.ADMIN) {
          return group
        }
        return false
      })
    }
    return false
  })
}

dbapi.getOwnerGroups = function(email) {
  return dbapi.getRootGroup().then(function(group) {
    if (email === group.owner.email) {
      return dbapi.getGroups()
    }
    return dbapi.getGroupsByIndex(email, 'owner')
  })
}

dbapi.createGroup = function(data) {
  const id = util.format('%s', uuid.v4()).replace(/-/g, '')

  return db.run(r.table('groups').insert(
    Object.assign(data, {
      id: id
    , users: _.union(data.users, [data.owner.email])
    , devices: []
    , createdAt: r.now()
    , lock: {
        user: false
      , admin: false
      }
    , ticket: null
    })))
    .then(function() {
      return dbapi.getGroup(id)
    })
}

dbapi.createUserGroup = function(data) {
  return dbapi.reserveUserGroupInstance(data.owner.email).then(function(stats) {
    if (stats.replaced) {
      return dbapi.getRootGroup().then(function(rootGroup) {
        data.users = [rootGroup.owner.email]
        return dbapi.createGroup(data).then(function(group) {
          return Promise.all([
            dbapi.addGroupUser(group.id, group.owner.email)
          , dbapi.addGroupUser(group.id, rootGroup.owner.email)
          ])
          .then(function() {
            return dbapi.getGroup(group.id)
          })
        })
      })
    }
    return false
  })
}

dbapi.updateGroup = function(id, data) {
  return db.run(r.table('groups').get(id).update(data))
    .then(function() {
      return dbapi.getGroup(id)
    })
}

dbapi.reserveUserGroupInstance = function(email) {
  return db.run(r.table('users').get(email)
    .update({groups: {quotas: {consumed: {number:
      r.branch(
        r.row('groups')('quotas')('consumed')('number')
         .add(1)
         .le(r.row('groups')('quotas')('allocated')('number'))
      , r.row('groups')('quotas')('consumed')('number')
         .add(1)
      , r.row('groups')('quotas')('consumed')('number'))
    }}}})
  )
}

dbapi.releaseUserGroupInstance = function(email) {
  return db.run(r.table('users').get(email)
    .update({groups: {quotas: {consumed: {number:
      r.branch(
        r.row('groups')('quotas')('consumed')('number').ge(1)
      , r.row('groups')('quotas')('consumed')('number').sub(1)
      , r.row('groups')('quotas')('consumed')('number'))
    }}}})
  )
}

dbapi.updateUserGroupDuration = function(email, oldDuration, newDuration) {
  return db.run(r.table('users').get(email)
    .update({groups: {quotas: {consumed: {duration:
      r.branch(
        r.row('groups')('quotas')('consumed')('duration')
         .sub(oldDuration).add(newDuration)
         .le(r.row('groups')('quotas')('allocated')('duration'))
      , r.row('groups')('quotas')('consumed')('duration')
         .sub(oldDuration).add(newDuration)
      , r.row('groups')('quotas')('consumed')('duration'))
    }}}})
  )
}

dbapi.updateUserGroupsQuotas = function(email, duration, number, repetitions) {
  return db
    .run(r.table('users').get(email)
    .update({groups: {quotas: {allocated: {
      duration:
        r.branch(
          r.expr(duration)
           .ne(null)
           .and(r.row('groups')('quotas')('consumed')('duration')
             .le(duration))
           .and(r.expr(number)
             .eq(null)
             .or(r.row('groups')('quotas')('consumed')('number')
               .le(number)))
        , duration
        , r.row('groups')('quotas')('allocated')('duration'))
    , number:
        r.branch(
          r.expr(number)
            .ne(null)
            .and(r.row('groups')('quotas')('consumed')('number')
              .le(number))
            .and(r.expr(duration)
              .eq(null)
              .or(r.row('groups')('quotas')('consumed')('duration')
                .le(duration)))
        , number
        , r.row('groups')('quotas')('allocated')('number'))
    }
    , repetitions:
        r.branch(
          r.expr(repetitions).ne(null)
        , repetitions
        , r.row('groups')('quotas')('repetitions'))
    }}}, {returnChanges: true}))
}

dbapi.updateDefaultUserGroupsQuotas = function(email, duration, number, repetitions) {
  return db.run(r.table('users').get(email)
    .update({groups: {quotas: {
      defaultGroupsDuration:
        r.branch(
          r.expr(duration).ne(null)
        , duration
        , r.row('groups')('quotas')('defaultGroupsDuration'))
    , defaultGroupsNumber:
        r.branch(
          r.expr(number).ne(null)
        , number
        , r.row('groups')('quotas')('defaultGroupsNumber'))
    , defaultGroupsRepetitions:
        r.branch(
          r.expr(repetitions).ne(null)
        , repetitions
        , r.row('groups')('quotas')('defaultGroupsRepetitions'))
    }}}, {returnChanges: true}))
}

dbapi.updateDeviceCurrentGroupFromOrigin = function(serial) {
  return db.run(r.table('devices').get(serial)).then(function(device) {
    return db.run(r.table('groups').get(device.group.origin)).then(function(group) {
      return db.run(r.table('devices').get(serial).update({group: {
        id: r.row('group')('origin')
      , name: r.row('group')('originName')
      , owner: group.owner
      , lifeTime: group.dates[0]
      , class: group.class
      , repetitions: group.repetitions
      }}))
    })
  })
}

dbapi.askUpdateDeviceOriginGroup = function(serial, group, signature) {
   return db.run(r.table('groups').get(group.id)
     .update({ticket: {
       serial: serial
     , signature: signature
     }})
   )
}

dbapi.updateDeviceOriginGroup = function(serial, group) {
  return db.run(r.table('devices').get(serial)
    .update({group: {
       origin: group.id
     , originName: group.name
     , id: r.branch(
         r.row('group')('id').eq(r.row('group')('origin'))
       , group.id
       , r.row('group')('id'))
     , name: r.branch(
         r.row('group')('id').eq(r.row('group')('origin'))
       , group.name
       , r.row('group')('name'))
     , owner: r.branch(
         r.row('group')('id').eq(r.row('group')('origin'))
       , group.owner
       , r.row('group')('owner'))
     , lifeTime: r.branch(
         r.row('group')('id').eq(r.row('group')('origin'))
       , group.dates[0]
       , r.row('group')('lifeTime'))
     , class: r.branch(
         r.row('group')('id').eq(r.row('group')('origin'))
       , group.class
       , r.row('group')('class'))
     , repetitions: r.branch(
         r.row('group')('id').eq(r.row('group')('origin'))
       , group.repetitions
       , r.row('group')('repetitions'))
    }})
  )
  .then(function() {
    return db.run(r.table('devices').get(serial))
  })
}

dbapi.updateDeviceCurrentGroup = function(serial, group) {
  return db.run(r.table('devices').get(serial)
    .update({group: {
      id: group.id
    , name: group.name
    , owner: group.owner
    , lifeTime: group.dates[0]
    , class: group.class
    , repetitions: group.repetitions
    }})
  )
}

dbapi.updateUserGroup = function(group, data) {
  return dbapi.updateUserGroupDuration(group.owner.email, group.duration, data.duration)
    .then(function(stats) {
      if (stats.replaced || stats.unchanged && group.duration === data.duration) {
        return dbapi.updateGroup(group.id, data)
      }
      return false
    })
}

dbapi.deleteGroup = function(id) {
  return db.run(r.table('groups').get(id).delete())
}

dbapi.deleteUserGroup = function(id) {
  function deleteUserGroup(group) {
    return dbapi.deleteGroup(group.id)
      .then(function() {
        return Promise.map(group.users, function(email) {
          return dbapi.removeGroupUser(group.id, email)
        })
      })
      .then(function() {
        return dbapi.releaseUserGroupInstance(group.owner.email)
      })
      .then(function() {
        return dbapi.updateUserGroupDuration(group.owner.email, group.duration, 0)
      })
      .then(function() {
        return 'deleted'
      })
  }

  return dbapi.getGroup(id).then(function(group) {
    if (group.privilege !== apiutil.ROOT) {
      return deleteUserGroup(group)
    }
    return 'forbidden'
  })
}

dbapi.createUser = function(email, name, ip) {
  return dbapi.getRootGroup().then(function(group) {
    return dbapi.loadUser(group.owner.email).then(function(adminUser) {
      return db.run(r.table('users').insert({
        email: email
      , name: name
      , ip: ip
      , group: wireutil.makePrivateChannel()
      , lastLoggedInAt: r.now()
      , createdAt: r.now()
      , forwards: []
      , settings: {}
      , privilege: adminUser ? apiutil.USER : apiutil.ADMIN
      , groups: {
          subscribed: []
        , lock: false
        , quotas: {
            allocated: {
              number: adminUser ?
                adminUser.groups.quotas.defaultGroupsNumber :
                group.envUserGroupsNumber
            , duration: adminUser ?
                adminUser.groups.quotas.defaultGroupsDuration :
                group.envUserGroupsDuration
            }
          , consumed: {
              number: 0
            , duration: 0
            }
          , defaultGroupsNumber: adminUser ? 0 : group.envUserGroupsNumber
          , defaultGroupsDuration: adminUser ? 0 : group.envUserGroupsDuration
          , defaultGroupsRepetitions: adminUser ? 0 : group.envUserGroupsRepetitions
          , repetitions: adminUser ?
              adminUser.groups.quotas.defaultGroupsRepetitions :
              group.envUserGroupsRepetitions
          }
        }
      }, {returnChanges: true}))
      .then(function(stats) {
        if (stats.inserted) {
          return dbapi.addGroupUser(group.id, email).then(function() {
            return dbapi.loadUser(email).then(function(user) {
              stats.changes[0].new_val = user
              return stats
            })
          })
        }
        return stats
      })
    })
  })
}

dbapi.saveUserAfterLogin = function(user) {
  return db.run(r.table('users').get(user.email).update({
      name: user.name
    , ip: user.ip
    , lastLoggedInAt: r.now()
    }))
    .then(function(stats) {
      if (stats.skipped) {
        return dbapi.createUser(user.email, user.name, user.ip)
      }
      return stats
    })
}

dbapi.loadUser = function(email) {
  return db.run(r.table('users').get(email))
}

dbapi.updateUserSettings = function(email, changes) {
  return db.run(r.table('users').get(email).update({
    settings: changes
  }))
}

dbapi.resetUserSettings = function(email) {
  return db.run(r.table('users').get(email).update({
    settings: r.literal({})
  }))
}

dbapi.insertUserAdbKey = function(email, key) {
  return db.run(r.table('users').get(email).update({
    adbKeys: r.row('adbKeys').default([]).append({
      title: key.title
    , fingerprint: key.fingerprint
    })
  }))
}

dbapi.deleteUserAdbKey = function(email, fingerprint) {
  return db.run(r.table('users').get(email).update({
    adbKeys: r.row('adbKeys').default([]).filter(function(key) {
      return key('fingerprint').ne(fingerprint)
    })
  }))
}

dbapi.lookupUsersByAdbKey = function(fingerprint) {
  return db.run(r.table('users').getAll(fingerprint, {
    index: 'adbKeys'
  }))
}

dbapi.lookupUserByAdbFingerprint = function(fingerprint) {
  return db.run(r.table('users').getAll(fingerprint, {
      index: 'adbKeys'
    })
    .pluck('email', 'name', 'group'))
    .then(function(cursor) {
      return cursor.toArray()
    })
    .then(function(groups) {
      switch (groups.length) {
        case 1:
          return groups[0]
        case 0:
          return null
        default:
          throw new Error('Found multiple users for same ADB fingerprint')
      }
    })
}

dbapi.lookupUserByVncAuthResponse = function(response, serial) {
  return db.run(r.table('vncauth').getAll([response, serial], {
      index: 'responsePerDevice'
    })
    .eqJoin('userId', r.table('users'))('right')
    .pluck('email', 'name', 'group'))
    .then(function(cursor) {
      return cursor.toArray()
    })
    .then(function(groups) {
      switch (groups.length) {
        case 1:
          return groups[0]
        case 0:
          return null
        default:
          throw new Error('Found multiple users with the same VNC response')
      }
    })
}

dbapi.loadUserDevices = function(email) {
  return db.run(r.table('users').get(email).getField('groups'))
    .then(function(groups) {
      return db.run(r.table('devices').filter(function(device) {
        return r.expr(groups.subscribed)
          .contains(device('group')('id'))
          .and(device('owner')('email').eq(email))
          .and(device('present').eq(true))
      }))
    })
}

dbapi.saveDeviceLog = function(serial, entry) {
  return db.run(r.table('logs').insert({
      serial: serial
    , timestamp: r.epochTime(entry.timestamp)
    , priority: entry.priority
    , tag: entry.tag
    , pid: entry.pid
    , message: entry.message
    }
  , {
      durability: 'soft'
    }))
}

dbapi.saveDeviceInitialState = function(serial, device) {
  var data = {
    present: true
  , presenceChangedAt: r.now()
  , provider: device.provider
  , owner: null
  , status: device.status
  , statusChangedAt: r.now()
  , ready: false
  , reverseForwards: []
  , remoteConnect: false
  , remoteConnectUrl: null
  , usage: null
  , logs_enabled: false
  }
  return db.run(r.table('devices').get(serial).update(data)).then(function(stats) {
    if (stats.skipped) {
      return dbapi.getRootGroup().then(function(group) {
        data.serial = serial
        data.createdAt = r.now()
        data.group = {
          id: group.id
        , name: group.name
        , lifeTime: group.dates[0]
        , owner: group.owner
        , origin: group.id
        , class: group.class
        , repetitions: group.repetitions
        , originName: group.name
        , lock: false
        }
        return db.run(r.table('devices').insert(data)).then(function() {
          dbapi.addOriginGroupDevice(group, serial)
        })
      })
    }
    return true
  })
  .then(function() {
    return db.run(r.table('devices').get(serial))
  })
}

dbapi.setDeviceConnectUrl = function(serial, url) {
  return db.run(r.table('devices').get(serial).update({
    remoteConnectUrl: url
  , remoteConnect: true
  }))
}

dbapi.unsetDeviceConnectUrl = function(serial) {
  return db.run(r.table('devices').get(serial).update({
    remoteConnectUrl: null
  , remoteConnect: false
  }))
}

dbapi.saveDeviceStatus = function(serial, status) {
  return db.run(r.table('devices').get(serial).update({
    status: status
  , statusChangedAt: r.now()
  }))
}

dbapi.setDeviceOwner = function(serial, owner) {
  return db.run(r.table('devices').get(serial).update({
    owner: owner
  }))
}

dbapi.unsetDeviceOwner = function(serial) {
  return db.run(r.table('devices').get(serial).update({
    owner: null
  }))
}

dbapi.setDevicePresent = function(serial) {
  return db.run(r.table('devices').get(serial).update({
    present: true
  , presenceChangedAt: r.now()
  }))
}

dbapi.setDeviceAbsent = function(serial) {
  return db.run(r.table('devices').get(serial).update({
    present: false
  , presenceChangedAt: r.now()
  }))
}

dbapi.setDeviceUsage = function(serial, usage) {
  return db.run(r.table('devices').get(serial).update({
    usage: usage
  , usageChangedAt: r.now()
  }))
}

dbapi.unsetDeviceUsage = function(serial) {
  return db.run(r.table('devices').get(serial).update({
    usage: null
  , usageChangedAt: r.now()
  , logs_enabled: false
  }))
}

dbapi.setDeviceAirplaneMode = function(serial, enabled) {
  return db.run(r.table('devices').get(serial).update({
    airplaneMode: enabled
  }))
}

dbapi.setDeviceBattery = function(serial, battery) {
  return db.run(r.table('devices').get(serial).update({
      battery: {
        status: battery.status
      , health: battery.health
      , source: battery.source
      , level: battery.level
      , scale: battery.scale
      , temp: battery.temp
      , voltage: battery.voltage
      }
    }
  , {
      durability: 'soft'
    }))
}

dbapi.setDeviceBrowser = function(serial, browser) {
  return db.run(r.table('devices').get(serial).update({
    browser: {
      selected: browser.selected
    , apps: browser.apps
    }
  }))
}

dbapi.setDeviceConnectivity = function(serial, connectivity) {
  return db.run(r.table('devices').get(serial).update({
    network: {
      connected: connectivity.connected
    , type: connectivity.type
    , subtype: connectivity.subtype
    , failover: !!connectivity.failover
    , roaming: !!connectivity.roaming
    }
  }))
}

dbapi.setDevicePhoneState = function(serial, state) {
  return db.run(r.table('devices').get(serial).update({
    network: {
      state: state.state
    , manual: state.manual
    , operator: state.operator
    }
  }))
}

dbapi.setDeviceRotation = function(serial, rotation) {
  return db.run(r.table('devices').get(serial).update({
    display: {
      rotation: rotation
    }
  }))
}

dbapi.setDeviceNote = function(serial, note) {
  return db.run(r.table('devices').get(serial).update({
    notes: note
  }))
}

dbapi.setDeviceReverseForwards = function(serial, forwards) {
  return db.run(r.table('devices').get(serial).update({
    reverseForwards: forwards
  }))
}

dbapi.setDeviceReady = function(serial, channel) {
  return db.run(r.table('devices').get(serial).update({
    channel: channel
  , ready: true
  , owner: null
  , reverseForwards: []
  }))
}

dbapi.saveDeviceIdentity = function(serial, identity) {
  return db.run(r.table('devices').get(serial).update({
    platform: identity.platform
  , manufacturer: identity.manufacturer
  , operator: identity.operator
  , model: identity.model
  , version: identity.version
  , abi: identity.abi
  , sdk: identity.sdk
  , display: identity.display
  , phone: identity.phone
  , product: identity.product
  , cpuPlatform: identity.cpuPlatform
  , openGLESVersion: identity.openGLESVersion
  , marketName: identity.marketName
  }))
}

dbapi.loadDevices = function(groups) {
  return db.run(r.table('devices').filter(function(device) {
    return r.expr(groups).contains(device('group')('id'))
  }))
  .then(function(cursor) {
    return cursor.toArray()
  })
}

dbapi.loadDevicesByOrigin = function(groups) {
  return db.run(r.table('devices').filter(function(device) {
    return r.expr(groups).contains(device('group')('origin'))
  }))
  .then(function(cursor) {
    return cursor.toArray()
  })
}

dbapi.loadBookableDevices = function(groups) {
  return db.run(r.table('devices').filter(function(device) {
    return r.expr(groups)
      .contains(device('group')('origin'))
      .and(device('group')('class').ne(apiutil.STANDARD))
  }))
  .then(function(cursor) {
    return cursor.toArray()
  })
}

dbapi.loadStandardDevices = function(groups) {
  return db.run(r.table('devices').filter(function(device) {
    return r.expr(groups)
      .contains(device('group')('origin'))
      .and(device('group')('class').eq(apiutil.STANDARD))
  }))
  .then(function(cursor) {
    return cursor.toArray()
  })
}

dbapi.loadPresentDevices = function() {
  return db.run(r.table('devices').getAll(true, {
    index: 'present'
  }))
}

dbapi.loadDeviceBySerial = function(serial) {
  return db.run(r.table('devices').get(serial))
}

dbapi.loadDevice = function(groups, serial) {
  return db.run(r.table('devices').getAll(serial).filter(function(device) {
    return r.expr(groups).contains(device('group')('id'))
  }))
}

dbapi.loadBookableDevice = function(groups, serial) {
  return db.run(r.table('devices').getAll(serial).filter(function(device) {
    return r.expr(groups)
      .contains(device('group')('origin'))
      .and(device('group')('class').ne(apiutil.STANDARD))
  }))
  .then(function(cursor) {
    return cursor.toArray()
  })
}

dbapi.loadDeviceByOrigin = function(groups, serial) {
  return db.run(r.table('devices').getAll(serial).filter(function(device) {
    return r.expr(groups).contains(device('group')('origin'))
  }))
  .then(function(cursor) {
    return cursor.toArray()
  })
}

dbapi.saveUserAccessToken = function(email, token) {
  return db.run(r.table('accessTokens').insert({
    email: email
  , id: token.id
  , title: token.title
  , jwt: token.jwt
  }, {returnChanges: true}))
}

dbapi.removeUserAccessTokens = function(email) {
  return db.run(r.table('accessTokens').getAll(email, {
    index: 'email'
  }).delete())
}

dbapi.removeUserAccessToken = function(email, title) {
  return db.run(r.table('accessTokens').getAll(email, {
    index: 'email'
  }).filter({title: title}).delete())
}

dbapi.removeAccessToken = function(id) {
  return db.run(r.table('accessTokens').get(id).delete())
}

dbapi.loadAccessTokens = function(email) {
  return db.run(r.table('accessTokens').getAll(email, {
    index: 'email'
  }))
}

dbapi.loadAccessToken = function(id) {
  return db.run(r.table('accessTokens').get(id))
}

module.exports = dbapi
