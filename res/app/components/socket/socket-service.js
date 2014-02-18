var io = require('socket.io')

module.exports = function SocketServiceFactory() {
  var socketService = io.connect()
  return socketService
}
