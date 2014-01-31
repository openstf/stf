define(['./module', 'socket.io'], function(mod, io) {
  function SocketServiceFactory() {
    var socketService = io.connect()
    return socketService
  }

  mod.factory('socketService', [SocketServiceFactory])
})
