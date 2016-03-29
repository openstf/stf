var Promise = require('bluebird')
var uuid = require('node-uuid')

module.exports = function TransactionServiceFactory(socket, TransactionError) {
  var transactionService = {}

  function createChannel() {
    return 'tx.' + uuid.v4()
  }

  function MultiTargetTransaction(targets, options) {
    var pending = Object.create(null)
    var results = []
    var channel = createChannel()

    function doneListener(someChannel, data) {
      if (someChannel === channel) {
        pending[data.source].done(data)
      }
    }

    function progressListener(someChannel, data) {
      if (someChannel === channel) {
        pending[data.source].progress(data)
      }
    }

    function cancelListener(someChannel, data) {
      if (someChannel === channel) {
        Object.keys(pending).forEach(function(source) {
          pending[source].cancel(data)
        })
      }
    }

    socket.on('tx.done', doneListener)
    socket.on('tx.progress', progressListener)
    socket.on('tx.cancel', cancelListener)

    this.channel = channel
    this.results = results
    this.promise = Promise.settle(targets.map(function(target) {
        var result = new options.result(target)
        var pendingResult = new PendingTransactionResult(result)
        pending[options.id ? target[options.id] : target.id] = pendingResult
        results.push(result)
        return pendingResult.promise
      }))
      .finally(function() {
        socket.removeListener('tx.done', doneListener)
        socket.removeListener('tx.progress', progressListener)
        socket.removeListener('tx.cancel', cancelListener)
        socket.emit('tx.cleanup', channel)
      })
      .progressed(function() {
        return results
      })
      .then(function() {
        return results
      })
  }

  function SingleTargetTransaction(target, options) {
    var result = new options.result(target)
    var pending = new PendingTransactionResult(result)
    var channel = createChannel()

    function doneListener(someChannel, data) {
      if (someChannel === channel) {
        pending.done(data)
      }
    }

    function progressListener(someChannel, data) {
      if (someChannel === channel) {
        pending.progress(data)
      }
    }

    function cancelListener(someChannel, data) {
      if (someChannel === channel) {
        pending.cancel(data)
      }
    }

    socket.on('tx.done', doneListener)
    socket.on('tx.progress', progressListener)
    socket.on('tx.cancel', cancelListener)

    this.channel = channel
    this.result = result
    this.results = [result]
    this.promise = pending.promise
      .finally(function() {
        socket.removeListener('tx.done', doneListener)
        socket.removeListener('tx.progress', progressListener)
        socket.removeListener('tx.cancel', cancelListener)
        socket.emit('tx.cleanup', channel)
      })
      .progressed(function() {
        return result
      })
      .then(function() {
        return result
      })
  }

  function PendingTransactionResult(result) {
    var resolver = Promise.defer()
    var seq = 0
    var last = Infinity
    var unplaced = []

    function readQueue() {
      var message
      var foundAny = false

      while (seq <= last && (message = unplaced[seq])) {
        unplaced[seq] = undefined

        if (seq === last) {
          result.success = message.success

          if (message.body) {
            result.body = JSON.parse(message.body)
          }

          if (result.success) {
            if (message.data) {
              result.lastData = result.data[seq] = message.data
            }
            resolver.resolve(result)
          }
          else {
            result.lastData = result.error = message.data
            resolver.reject(new TransactionError(result))
          }

          return
        }
        else {
          if (message.progress) {
            result.progress = message.progress
          }
        }

        foundAny = true
        result.lastData = result.data[seq++] = message.data
      }

      if (foundAny) {
        resolver.progress(result)
      }
    }

    this.progress = function(message) {
      unplaced[message.seq] = message
      readQueue()
    }

    this.done = function(message) {
      last = message.seq
      unplaced[message.seq] = message
      readQueue()
    }

    this.cancel = function(message) {
      if (!result.settled) {
        last = message.seq = seq
        unplaced[message.seq] = message
        readQueue()
      }
    }

    this.result = result
    this.promise = resolver.promise.finally(function() {
      result.settled = true
      result.progress = 100
    })
  }

  function TransactionResult(source) {
    this.source = source
    this.settled = false
    this.success = false
    this.progress = 0
    this.error = null
    this.data = []
    this.lastData = null
    this.body = null
  }

  function DeviceTransactionResult(device) {
    TransactionResult.call(this, device)
    this.device = this.source
  }

  DeviceTransactionResult.prototype = Object.create(TransactionResult)
  DeviceTransactionResult.constructor = DeviceTransactionResult

  transactionService.create = function(target, options) {
    if (options && !options.result) {
      options.result = TransactionResult
    }

    if (Array.isArray(target)) {
      return new MultiTargetTransaction(target, options || {
        result: DeviceTransactionResult
      , id: 'serial'
      })
    }
    else {
      return new SingleTargetTransaction(target, options || {
        result: DeviceTransactionResult
      , id: 'serial'
      })
    }
  }

  transactionService.punch = function(channel) {
    var resolver = Promise.defer()

    function punchListener(someChannel) {
      if (channel === someChannel) {
        resolver.resolve(channel)
      }
    }

    socket.on('tx.punch', punchListener)
    socket.emit('tx.punch', channel)

    return resolver.promise
      .timeout(5000)
      .finally(function() {
        socket.removeListener('tx.punch', punchListener)
      })
  }

  return transactionService
}
