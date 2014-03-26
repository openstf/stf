module.exports = function GroupServiceFactory(
  socket
, TransactionService
) {
  var groupService = {
  }

  groupService.invite = function (device) {
    var tx = TransactionService.create([device])
    socket.emit('group.invite', device.channel, tx.channel, {
      serial: {
        value: device.serial
      , match: 'exact'
      }
    })
    return tx.promise.then(function(results) {
      if (!results[0].success) {
        throw new Error('Device refused to join the group')
      }
      return results[0].device
    })
  }

  groupService.kick = function (device) {
    var tx = TransactionService.create([device])
    socket.emit('group.kick', device.channel, tx.channel, {
      serial: {
        value: device.serial
      , match: 'exact'
      }
    })
    return tx.promise.then(function(results) {
      if (!results[0].success) {
        throw new Error('Device refused to be kicked from the group')
      }
      return results[0].device
    })
  }

  return groupService
}
