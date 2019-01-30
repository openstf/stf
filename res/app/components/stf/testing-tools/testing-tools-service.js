module.exports = function TestingToolsServiceFactory(
  $rootScope
  , $http
  , socket
) {
  let TestingToolsService = {}

  TestingToolsService.getTestingTools = function() {
    return $http.get('/api/v1/user/testingTools/')
  }

  TestingToolsService.addTestingTool = function(tool) {
    socket.emit('testing.tool.add', tool)
  }

  TestingToolsService.removeTestingTool = function(tool) {
    socket.emit('testing.tool.remove', tool)
  }

  socket.on('testing.tool.added', function(tool) {
    $rootScope.$broadcast('testing.tool.updated', tool)
    $rootScope.$apply()
  })

  socket.on('testing.tool.removed', function(tool) {
    $rootScope.$broadcast('testing.tool.updated', tool)
    $rootScope.$apply()
  })

  socket.on('testing.tool.error', function(error) {
    $rootScope.$broadcast('testing.tool.error', error)
  })

  return TestingToolsService
}
