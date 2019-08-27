/**
* Copyright © 2019 contains code contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

var util = require('util')

var _ = require('lodash')
var Promise = require('bluebird')
var uuid = require('uuid')
var adbkit = require('adbkit')
var dbapi = require('../../../db/api')
var logger = require('../../../util/logger')
var datautil = require('../../../util/datautil')
var deviceutil = require('../../../util/deviceutil')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')
var wirerouter = require('../../../wire/router')

const apiutil = require('../../../util/apiutil')
const jwtutil = require('../../../util/jwtutil')

var log = logger.createLogger('api:controllers:user')

module.exports = {
  getUser: getUser
, getUserDevices: getUserDevices
, addUserDevice: addUserDevice
, getUserDeviceBySerial: getUserDeviceBySerial
, deleteUserDeviceBySerial: deleteUserDeviceBySerial
, remoteConnectUserDeviceBySerial: remoteConnectUserDeviceBySerial
, remoteDisconnectUserDeviceBySerial: remoteDisconnectUserDeviceBySerial
, getUserAccessTokens: getUserAccessTokens
, addAdbPublicKey: addAdbPublicKey
, addUserDeviceV2: addUserDevice
, getAccessTokens: getAccessTokens
, getAccessToken: getAccessToken
, createAccessToken: createAccessToken
, deleteAccessToken: deleteAccessToken
, deleteAccessTokens: deleteAccessTokens
}

function getUser(req, res) {
  // delete req.user.groups.lock
  res.json({
    success: true
  , user: req.user
  })
}

function getUserDevices(req, res) {
  var fields = req.swagger.params.fields.value

  dbapi.loadUserDevices(req.user.email)
    .then(function(cursor) {
      return Promise.promisify(cursor.toArray, cursor)()
        .then(function(list) {
          var deviceList = []

          list.forEach(function(device) {
            datautil.normalize(device, req.user)
            var responseDevice = device
            if (fields) {
              responseDevice = _.pick(device, fields.split(','))
            }
            deviceList.push(responseDevice)
          })

          res.json({
            success: true
          , description: 'Controlled devices information'
          , devices: deviceList
          })
        })
    })
    .catch(function(err) {
      log.error('Failed to load device list: ', err.stack)
      res.status(500).json({
        success: false
      , description: 'Internal Server Error'
      })
    })
}

function getUserDeviceBySerial(req, res) {
  var serial = req.swagger.params.serial.value
  var fields = req.swagger.params.fields.value

  dbapi.loadDevice(req.user.groups.subscribed, serial)
    .then(function(cursor) {
      cursor.next(function(err, device) {
        if (err) {
          return res.status(404).json({
            success: false
          , description: 'Device not found'
          })
        }

        datautil.normalize(device, req.user)
        if (!deviceutil.isOwnedByUser(device, req.user)) {
          return res.status(403).json({
            success: false
          , description: 'Device is not owned by you'
          })
        }

        var responseDevice = device
        if (fields) {
          responseDevice = _.pick(device, fields.split(','))
        }

        res.json({
          success: true
        , description: 'Controlled device information'
        , device: responseDevice
        })
      })
    })
    .catch(function(err) {
      log.error('Failed to load device "%s": ', req.params.serial, err.stack)
      res.status(500).json({
        success: false
      , description: 'Internal Server Error'
      })
    })
}

function addUserDevice(req, res) {
  var serial = req.hasOwnProperty('body') ? req.body.serial : req.swagger.params.serial.value
  var timeout = req.hasOwnProperty('body') ? req.body.timeout ||
                                             null : req.swagger.params.timeout.value || null

  dbapi.loadDevice(req.user.groups.subscribed, serial)
    .then(function(cursor) {
      cursor.next(function(err, device) {
        if (err) {
          return res.status(404).json({
            success: false
          , description: 'Device not found'
          })
        }

        datautil.normalize(device, req.user)
        if (!deviceutil.isAddable(device, req.user)) {
          return res.status(403).json({
            success: false
          , description: 'Device is being used or not available'
          })
        }

        // Timer will be called if no JoinGroupMessage is received till 5 seconds
        var responseTimer = setTimeout(function() {
          req.options.channelRouter.removeListener(wireutil.global, messageListener)
          return res.status(504).json({
              success: false
            , description: 'Device is not responding'
          })
        }, 5000)

        var messageListener = wirerouter()
          .on(wire.JoinGroupMessage, function(channel, message) {
            if (message.serial === serial && message.owner.email === req.user.email) {
              clearTimeout(responseTimer)
              req.options.channelRouter.removeListener(wireutil.global, messageListener)

              return res.json({
                success: true
              , description: 'Device successfully added'
              })
            }
          })
          .handler()

        req.options.channelRouter.on(wireutil.global, messageListener)
        var usage = 'automation'

        req.options.push.send([
          device.channel
        , wireutil.envelope(
            new wire.GroupMessage(
              new wire.OwnerMessage(
                req.user.email
              , req.user.name
              , req.user.group
              )
            , timeout
            , wireutil.toDeviceRequirements({
              serial: {
                value: serial
              , match: 'exact'
              }
            })
            , usage
            )
          )
        ])
      })
    })
    .catch(function(err) {
      log.error('Failed to load device "%s": ', req.params.serial, err.stack)
      res.status(500).json({
        success: false
      , description: 'Internal Server Error'
      })
    })
}

function deleteUserDeviceBySerial(req, res) {
  var serial = req.swagger.params.serial.value

  dbapi.loadDevice(req.user.groups.subscribed, serial)
    .then(function(cursor) {
      cursor.next(function(err, device) {
        if (err) {
          return res.status(404).json({
            success: false
          , description: 'Device not found'
          })
        }

        datautil.normalize(device, req.user)
        if (!deviceutil.isOwnedByUser(device, req.user)) {
          return res.status(403).json({
            success: false
          , description: 'You cannot release this device. Not owned by you'
          })
        }

        // Timer will be called if no JoinGroupMessage is received till 5 seconds
        var responseTimer = setTimeout(function() {
          req.options.channelRouter.removeListener(wireutil.global, messageListener)
          return res.status(504).json({
              success: false
            , description: 'Device is not responding'
          })
        }, 5000)

        var messageListener = wirerouter()
          .on(wire.LeaveGroupMessage, function(channel, message) {
            if (message.serial === serial &&
                (message.owner.email === req.user.email || req.user.privilege === 'admin')) {
              clearTimeout(responseTimer)
              req.options.channelRouter.removeListener(wireutil.global, messageListener)

              return res.json({
                success: true
              , description: 'Device successfully removed'
              })
            }
          })
          .handler()

        req.options.channelRouter.on(wireutil.global, messageListener)

        req.options.push.send([
          device.channel
        , wireutil.envelope(
            new wire.UngroupMessage(
              wireutil.toDeviceRequirements({
                serial: {
                  value: serial
                , match: 'exact'
                }
              })
            )
          )
        ])
      })
    })
    .catch(function(err) {
      log.error('Failed to load device "%s": ', req.params.serial, err.stack)
      res.status(500).json({
        success: false
      , description: 'Internal Server Error'
      })
    })
}

function remoteConnectUserDeviceBySerial(req, res) {
  var serial = req.swagger.params.serial.value

  dbapi.loadDevice(req.user.groups.subscribed, serial)
    .then(function(cursor) {
      cursor.next(function(err, device) {
        if (err) {
          return res.status(404).json({
            success: false
          , description: 'Device not found'
          })
        }

	datautil.normalize(device, req.user)
	if (!deviceutil.isOwnedByUser(device, req.user)) {
          return res.status(403).json({
            success: false
          , description: 'Device is not owned by you or is not available'
          })
        }

        var responseChannel = 'txn_' + uuid.v4()
        req.options.sub.subscribe(responseChannel)

	// Timer will be called if no JoinGroupMessage is received till 5 seconds
        var timer = setTimeout(function() {
          req.options.channelRouter.removeListener(responseChannel, messageListener)
          req.options.sub.unsubscribe(responseChannel)
          return res.status(504).json({
              success: false
            , description: 'Device is not responding'
          })
        }, 5000)

        var messageListener = wirerouter()
          .on(wire.ConnectStartedMessage, function(channel, message) {
            if (message.serial === serial) {
              clearTimeout(timer)
              req.options.sub.unsubscribe(responseChannel)
              req.options.channelRouter.removeListener(responseChannel, messageListener)
              return res.json({
                success: true
              , description: 'Remote connection is enabled'
              , remoteConnectUrl: message.url
              })
            }
          })
          .handler()

        req.options.channelRouter.on(responseChannel, messageListener)

        req.options.push.send([
          device.channel
        , wireutil.transaction(
            responseChannel
          , new wire.ConnectStartMessage()
          )
        ])
      })
    })
    .catch(function(err) {
      log.error('Failed to load device "%s": ', req.params.serial, err.stack)
      res.status(500).json({
        success: false
      , description: 'Internal Server Error'
      })
    })
}

function remoteDisconnectUserDeviceBySerial(req, res) {
  var serial = req.swagger.params.serial.value

  dbapi.loadDevice(req.user.groups.subscribed, serial)
    .then(function(cursor) {
      cursor.next(function(err, device) {
        if (err) {
          return res.status(404).json({
            success: false
          , description: 'Device not found'
          })
        }

        datautil.normalize(device, req.user)
        if (!deviceutil.isOwnedByUser(device, req.user)) {
          return res.status(403).json({
            success: false
          , description: 'Device is not owned by you or is not available'
          })
        }

        var responseChannel = 'txn_' + uuid.v4()
        req.options.sub.subscribe(responseChannel)

        // Timer will be called if no JoinGroupMessage is received till 5 seconds
        var timer = setTimeout(function() {
          req.options.channelRouter.removeListener(responseChannel, messageListener)
          req.options.sub.unsubscribe(responseChannel)
          return res.status(504).json({
            success: false
          , description: 'Device is not responding'
          })
        }, 5000)

        var messageListener = wirerouter()
          .on(wire.ConnectStoppedMessage, function(channel, message) {
            if (message.serial === serial) {
              clearTimeout(timer)
              req.options.sub.unsubscribe(responseChannel)
              req.options.channelRouter.removeListener(responseChannel, messageListener)
              return res.json({
                success: true
              , description: 'Device remote disconnected successfully'
              })
            }
          })
          .handler()

        req.options.channelRouter.on(responseChannel, messageListener)

        req.options.push.send([
          device.channel
        , wireutil.transaction(
            responseChannel
          , new wire.ConnectStopMessage()
          )
        ])
      })
    })
    .catch(function(err) {
      log.error('Failed to load device "%s": ', req.params.serial, err.stack)
      res.status(500).json({
        success: false
      , description: 'Internal Server Error'
      })
    })
}

function getUserAccessTokens(req, res) {
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
      res.status(500).json({
        success: false
      })
    })
}

function addAdbPublicKey(req, res) {
  var data = req.swagger.params.adb.value
  adbkit.util.parsePublicKey(data.publickey)
    .then(function(key) {
      return dbapi.lookupUsersByAdbKey(key.fingerprint)
        .then(function(cursor) {
          return cursor.toArray()
        })
        .then(function(users) {
          return {
            key: {
              title: data.title || key.comment
            , fingerprint: key.fingerprint
            }
          , users: users
          }
        })
    })
    .then(function(data) {
      if (data.users.length) {
        return res.json({
          success: true
        })
      }
      else {
        return dbapi.insertUserAdbKey(req.user.email, data.key)
          .then(function() {
            return res.json({
              success: true
            })
          })
      }
    })
    .then(function() {
      req.options.push.send([
        req.user.group
      , wireutil.envelope(new wire.AdbKeysUpdatedMessage())
      ])
    })
    .catch(dbapi.DuplicateSecondaryIndexError, function() {
      // No-op
      return res.json({
        success: true
      })
    }).catch(function(err) {
      log.error('Failed to insert new adb key fingerprint: ', err.stack)
      return res.status(500).json({
        success: false
      , message: 'Unable to insert new adb key fingerprint to database'
      })
    })
}

function getAccessToken(req, res) {
  const id = req.swagger.params.id.value

  dbapi.loadAccessToken(id).then(function(token) {
    if (!token || token.email !== req.user.email) {
      apiutil.respond(res, 404, 'Not Found (access token)')
    }
    else {
      apiutil.respond(res, 200, 'Access Token Information', {
        token: apiutil.publishAccessToken(token)
      })
    }
  })
  .catch(function(err) {
    apiutil.internalError(res, 'Failed to delete access token "%s": ', id, err.stack)
  })
}

function getAccessTokens(req, res) {
  dbapi.loadAccessTokens(req.user.email).then(function(cursor) {
    Promise.promisify(cursor.toArray, cursor)().then(function(tokens) {
      const tokenList = []

      tokens.forEach(function(token) {
        tokenList.push(apiutil.publishAccessToken(token))
      })
      apiutil.respond(res, 200, 'Access Tokens Information', {tokens: tokenList})
    })
  })
  .catch(function(err) {
    apiutil.internalError(res, 'Failed to get access tokens: ', err.stack)
  })
}

function createAccessToken(req, res) {
  const title = req.swagger.params.title.value
  const jwt = jwtutil.encode({
    payload: {
      email: req.user.email
    , name: req.user.name
    }
  , secret: req.options.secret
  })
  const id = util.format('%s-%s', uuid.v4(), uuid.v4()).replace(/-/g, '')

  dbapi.saveUserAccessToken(req.user.email, {
    title: title
  , id: id
  , jwt: jwt
  })
  .then(function(stats) {
    req.options.pushdev.send([
      req.user.group
    , wireutil.envelope(new wire.UpdateAccessTokenMessage())
    ])
    apiutil.respond(res, 201, 'Created (access token)',
      {token: apiutil.publishAccessToken(stats.changes[0].new_val)})
  })
  .catch(function(err) {
    apiutil.internalError(res, 'Failed to create access token "%s": ', title, err.stack)
  })
}

function deleteAccessTokens(req, res) {
  dbapi.removeUserAccessTokens(req.user.email).then(function(stats) {
    if (!stats.deleted) {
     apiutil.respond(res, 200, 'Unchanged (access tokens)')
    }
    else {
      req.options.pushdev.send([
        req.user.group
      , wireutil.envelope(new wire.UpdateAccessTokenMessage())
      ])
      apiutil.respond(res, 200, 'Deleted (access tokens)')
    }
  })
  .catch(function(err) {
    apiutil.internalError(res, 'Failed to delete access tokens: ', err.stack)
  })
}

function deleteAccessToken(req, res) {
  const id = req.swagger.params.id.value

  dbapi.loadAccessToken(id).then(function(token) {
    if (!token || token.email !== req.user.email) {
      apiutil.respond(res, 404, 'Not Found (access token)')
    }
    else {
      dbapi.removeAccessToken(id).then(function(stats) {
        if (!stats.deleted) {
          apiutil.respond(res, 404, 'Not Found (access token)')
        }
        else {
          req.options.pushdev.send([
            req.user.group
          , wireutil.envelope(new wire.UpdateAccessTokenMessage())
          ])
          apiutil.respond(res, 200, 'Deleted (access token)')
        }
      })
    }
  })
  .catch(function(err) {
    apiutil.internalError(res, 'Failed to delete access token "%s": ', id, err.stack)
  })
}
