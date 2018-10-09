module.exports = function CommandExecutorServiceFactory(
  $rootScope
  , socket
) {
  var CommandExecutorService = {}

  CommandExecutorService.executeTestingTools = function(configs, storageId) {
    socket.emit('command.testing.tools.execute', configs, storageId)
  }

  socket.on('command.testing.tools.message', function(msg) {
    $rootScope.$broadcast('command.testing.tools.message', msg)
    $rootScope.$apply()
  })

  socket.on('command.testing.tools.finished', function(msg) {
    $rootScope.$broadcast('command.testing.tools.finished', msg)
    $rootScope.$apply()
  })

  socket.on('command.testing.tools.error', function(msg) {
    $rootScope.$broadcast('command.testing.tools.error', msg)
    $rootScope.$apply()
  })

  return CommandExecutorService
}
