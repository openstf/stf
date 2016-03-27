// ISSUE-100 (https://github.com/openstf/stf/issues/100)

// In some networks TCP Connection dies if kept idle for long.
// Setting TCP_KEEPALIVE option true, to all the zmq sockets
// won't let it die

var zmq = require('zmq')

var log = require('./logger').createLogger('util:zmqutil')

module.exports.socket = function() {
  var sock = zmq.socket.apply(zmq, arguments)

  ;['ZMQ_TCP_KEEPALIVE', 'ZMQ_TCP_KEEPALIVE_IDLE'].forEach(function(opt) {
    if (process.env[opt]) {
      try {
        sock.setsockopt(zmq[opt], Number(process.env[opt]))
      }
      catch (err) {
        log.warn('ZeroMQ library too old, no support for %s', opt)
      }
    }
  })

  return sock
}
