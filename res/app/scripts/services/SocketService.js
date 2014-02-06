define(['./_module', 'socket.io'], function(app, io) {
  function SocketServiceFactory() {
    var socketService = io.connect()
    return socketService
  }

  app.factory('SocketService', [SocketServiceFactory])
})
