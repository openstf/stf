define(['./_module', 'socket.io'], function(services, io) {
  function SocketServiceFactory() {
    var socketService = io.connect()
    return socketService
  }

  services.factory('SocketService', [SocketServiceFactory])
})
