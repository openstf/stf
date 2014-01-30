define(['./module', 'socket.io'], function(mod, io) {
  mod.factory('io', [function() {
    return io.connect()
  }])
})
