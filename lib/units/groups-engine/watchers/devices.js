/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

const wirerouter = require('../../../wire/router')
const _ = require('lodash')
const r = require('rethinkdb')
const util = require('util')
const uuid = require('uuid')
const logger = require('../../../util/logger')
const timeutil = require('../../../util/timeutil')
const wireutil = require('../../../wire/util')
const wire = require('../../../wire')
const dbapi = require('../../../db/api')
const db = require('../../../db')

module.exports = function(push, pushdev, channelRouter) {
  const log = logger.createLogger('watcher-devices')

  function sendReleaseDeviceControl(serial, channel) {
    push.send([
      channel
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
  }

  function sendDeviceGroupChange(id, group, serial, originName) {
    pushdev.send([
      wireutil.global
    , wireutil.envelope(
        new wire.DeviceGroupChangeMessage(
          id
        , new wire.DeviceGroupMessage(
            group.id
          , group.name
          , new wire.DeviceGroupOwnerMessage(
              group.owner.email
            , group.owner.name
            )
          , new wire.DeviceGroupLifetimeMessage(
              group.dates[0].start.getTime()
            , group.dates[0].stop.getTime()
            )
          , group.class
          , group.repetitions
          , originName
          )
        , serial
        )
      )
    ])
  }

  function sendDeviceChange(device1, device2, action) {
    function publishDevice() {
      const device = _.cloneDeep(device1)

      delete device.channel
      delete device.owner
      delete device.group.id
      delete device.group.lifeTime
      return device
    }

    pushdev.send([
      wireutil.global
    , wireutil.envelope(
        new wire.DeviceChangeMessage(
          publishDevice()
        , action
        , device2.group.origin
        , timeutil.now('nano')
        )
      )
    ])
  }

  function sendReleaseDeviceControlAndDeviceGroupChange(
    device
  , sendDeviceGroupChangeWrapper) {
    let messageListener
    const responseTimer = setTimeout(function() {
      channelRouter.removeListener(wireutil.global, messageListener)
      sendDeviceGroupChangeWrapper()
    }, 5000)

    messageListener = wirerouter()
      .on(wire.LeaveGroupMessage, function(channel, message) {
        if (message.serial === device.serial &&
            message.owner.email === device.owner.email) {
          clearTimeout(responseTimer)
          channelRouter.removeListener(wireutil.global, messageListener)
          sendDeviceGroupChangeWrapper()
        }
      })
      .handler()

    channelRouter.on(wireutil.global, messageListener)
    sendReleaseDeviceControl(device.serial, device.channel)
  }

  db.run(r
    .table('devices')
    .pluck(
      'serial'
    , 'channel'
    , 'owner'
    , 'model'
    , 'operator'
    , 'manufacturer'
    , {group: ['id', 'origin', 'originName', 'lifeTime']}
    , {provider: ['name']}
    , {network: ['type', 'subtype']}
    , {display: ['height', 'width']}
    , 'version'
    , 'sdk'
    , 'abi'
    , 'cpuPlatform'
    , 'openGLESVersion'
    , {phone: ['imei']}
    , 'marketName'
    )
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
        return sendDeviceChange(data.new_val, data.new_val, 'created')
      }
      else if (data.new_val === null) {
        sendDeviceChange(data.old_val, data.old_val, 'deleted')
      }
      else if (data.new_val.model !== data.old_val.model ||
        data.new_val.group.origin !== data.old_val.group.origin ||
        data.new_val.operator !== data.old_val.operator ||
        data.new_val.hasOwnProperty('network') &&
        (!data.old_val.hasOwnProperty('network') ||
         data.new_val.network.type !== data.old_val.network.type ||
         data.new_val.network.subtype !== data.old_val.network.subtype
        ) ||
        data.new_val.provider.name !== data.old_val.provider.name) {
        sendDeviceChange(data.new_val, data.old_val, 'updated')
      }

      const isDeleted = data.new_val === null
      const id = isDeleted ? data.old_val.group.id : data.new_val.group.id

      return dbapi.getGroup(id).then(function(group) {
        function sendDeviceGroupChangeOnDeviceDeletion() {
          const fakeGroup = Object.assign({}, group)

          fakeGroup.id = util.format('%s', uuid.v4()).replace(/-/g, '')
          fakeGroup.name = 'none'
          sendDeviceGroupChange(
            group.id
          , fakeGroup
          , data.old_val.serial
          , data.old_val.group.originName
          )
        }

        function sendDeviceGroupChangeOnDeviceCurrentGroupUpdating() {
          sendDeviceGroupChange(
            data.old_val.group.id
          , group
          , data.new_val.serial
          , data.new_val.group.originName
          )
        }

        if (group) {
          if (isDeleted) {
            if (data.old_val.owner) {
              sendReleaseDeviceControlAndDeviceGroupChange(
                data.old_val
              , sendDeviceGroupChangeOnDeviceDeletion
              )
              return
            }
            sendDeviceGroupChangeOnDeviceDeletion()
            return
          }

          const isChangeCurrentGroup = data.new_val.group.id !== data.old_val.group.id
          const isChangeOriginGroup = data.new_val.group.origin !== data.old_val.group.origin
          const isChangeLifeTime =
            data.new_val.group.lifeTime.start.getTime() !==
            data.old_val.group.lifeTime.start.getTime()

          if (isChangeLifeTime && !isChangeCurrentGroup && !isChangeOriginGroup) {
            sendDeviceGroupChange(
              data.old_val.group.id
            , group
            , data.new_val.serial
            , data.new_val.group.originName
            )
            return
          }

          if (isChangeCurrentGroup) {
            if (data.new_val.owner && group.users.indexOf(data.new_val.owner.email) < 0) {
              sendReleaseDeviceControlAndDeviceGroupChange(
                data.new_val
              , sendDeviceGroupChangeOnDeviceCurrentGroupUpdating
              )
            }
            else {
              sendDeviceGroupChangeOnDeviceCurrentGroupUpdating()
            }
          }

          if (isChangeOriginGroup) {
            dbapi.getGroup(data.old_val.group.origin).then(function(originGroup) {
              if (originGroup) {
                dbapi.removeOriginGroupDevice(originGroup, data.new_val.serial)
              }
            })
            dbapi.getGroup(data.new_val.group.origin).then(function(originGroup) {
              if (originGroup) {
                dbapi.addOriginGroupDevice(originGroup, data.new_val.serial)
              }
            })
            if (!isChangeCurrentGroup) {
              sendDeviceGroupChange(
                data.new_val.group.id
              , group
              , data.new_val.serial
              , data.new_val.group.originName
              )
            }
          }
        }
      })
    })
  })
  .catch(function(err) {
    log.error('An error occured during DEVICES table watching', err.stack)
  })
}
