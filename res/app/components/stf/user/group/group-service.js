var Promise = require('bluebird')

module.exports = function GroupServiceFactory(
  socket
, TransactionService
, TransactionError
) {
  var groupService = {
  }


  function translateEmulatorSerialForProvider (serial){
  if(serial.indexOf('-') !== -1){
    return 'emulator-' + serial.split('-').pop(-1)
  }
  return serial
}

  groupService.invite = function(device) {
    if (!device.usable) {
      return Promise.reject(new Error('Device is not usable'))
    }
    var tx = TransactionService.create(device)
    socket.emit('group.invite', device.channel, tx.channel, {
      requirements: {
        serial: {
          value: translateEmulatorSerialForProvider(device.serial)
        , match: 'exact'
        }
      }
    })
    return tx.promise
      .then(function(result) {
        return result.device
      })
      .catch(TransactionError, function() {
        throw new Error('Device refused to join the group')
      })
  }

  groupService.kick = function(device, force) {
    if (!force && !device.usable) {
      return Promise.reject(new Error('Device is not usable'))
    }

    var tx = TransactionService.create(device)
    socket.emit('group.kick', device.channel, tx.channel, {
      requirements: {
        serial: {
          value: translateEmulatorSerialForProvider(device.serial)
        , match: 'exact'
        }
      }
    })
    return tx.promise
      .then(function(result) {
        return result.device
      })
      .catch(TransactionError, function() {
        throw new Error('Device refused to join the group')
      })
  }

  return groupService
}
