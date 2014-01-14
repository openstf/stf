var uuid = require('node-uuid')
var Promise = require('bluebird')

function newId() {
  return uuid.v4()
}

module.exports.newId = newId

function q(output, input, channel, args) {
  var deferred = Promise.defer()
    , ourId = newId()
    , results = []
    , mapping = {}
    , remaining = 0 // @todo pass expected number to query

  function onMessage(theirId, serial, state, data) {
    if (ourId === theirId.toString()) {
      serial = serial.toString()
      state = state.toString()

      var mapped = mapping[serial]

      if (!mapped) {
        results.push(mapped = mapping[serial] = {
            serial: serial
          , state: state
          , progress: 0
          , value: null
        })
      }
      else {
        mapped.state = state
      }

      switch (state) {
        case 'ACK':
          deferred.progress(results)
          ++remaining
          break
        case 'PRG':
          mapped.progress = +data
          deferred.progress(results)
          break
        case 'ERR':
          mapped.value = data
          --remaining
          break
        case 'OKY':
          mapped.progress = 100
          mapped.value = data
          --remaining
          break
      }

      if (remaining) {
        deferred.progress(results)
      }
      else {
        deferred.resolve(results)
      }
    }
  }

  input.on('message', onMessage)
  input.subscribe(ourId)

  output.send([channel, ourId].concat(args))

  return deferred.promise.finally(function() {
    input.unsubscribe(ourId)
    input.removeListener('message', onMessage)
    mapping = results = null
  })
}

module.exports.q = q
