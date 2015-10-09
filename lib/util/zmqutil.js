// ISSUE-100 (https://github.com/openstf/stf/issues/100)

// In some networks TCP Connection dies if kept idle for long.
// Setting TCP_KEEPALIVE option true, to all the zmq sockets
// won't let it die

var zmq = require('zmq')

module.exports.socket = function() {
  var sock = zmq.socket.apply(zmq, arguments)
  sock.setsockopt(zmq.ZMQ_TCP_KEEPALIVE, 1)
  sock.setsockopt(zmq.ZMQ_TCP_KEEPALIVE_IDLE, 300000)
  return sock
}
