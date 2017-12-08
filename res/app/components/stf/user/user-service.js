module.exports = function UserServiceFactory(
  $rootScope
, socket
, AppState
, AddAdbKeyModalService
) {
  var UserService = {}

  var user = UserService.currentUser = AppState.user

  UserService.getAdbKeys = function() {
    return (user.adbKeys || (user.adbKeys = []))
  }

  UserService.getAndroidEmulators = function() {
    return (user.androidEmulators || (user.androidEmulators = []))
  }

  UserService.addAdbKey = function(key) {
    socket.emit('user.keys.adb.add', key)
  }

  UserService.acceptAdbKey = function(key) {
    socket.emit('user.keys.adb.accept', key)
  }

  UserService.removeAdbKey = function(key) {
    socket.emit('user.keys.adb.remove', key)
  }

  UserService.getEmulatorList = function() {
    socket.emit('get.emulator.list')
  }

  UserService.updateEmulatorStartArgs = function(serial, args) {
    var data = {
    serial: serial
    , startArgs: args
    }
    socket.emit('update.emulator.args', data)
  }

  UserService.restartAVDEmulator = function(emulator_name, serial, avd_cmd) {
    UserService.updateEmulatorStartArgs(serial, avd_cmd)
    var user_data = {
      email : UserService.currentUser.email
      , group : UserService.currentUser.group
      , name : UserService.currentUser.name
    }
    socket.emit('avd.restart', emulator_name, serial, user_data)
  }

  socket.on('emulator.startingArgs.updated', function(serial, startArgs) {
    var data = {
      args :startArgs
      ,deviceSerial : serial
    }
    $rootScope.$broadcast('emulator.startargs.updated', data)
    $rootScope.$apply()
    }
    )

  socket.on('restart.unavailable',  function(user, serial) {
    var data = {
      userData : user
      ,deviceSerial : serial
    }
    $rootScope.$broadcast('emulator.restart.unavailable', data)
    $rootScope.$apply()
  })

  socket.on('emulator.startingArgs.updated.restarted',  function(serial, args) {
    var data = {
      userData : args
      ,deviceSerial : serial
    }
    $rootScope.$broadcast('emulator.startingArgs.updated.and.restarted', data)
    $rootScope.$apply()
  })

  socket.on('emulator.list.received',  function(key) {
    UserService.getAndroidEmulators().push(key)
    $rootScope.$broadcast('emulator.list.collected', user.androidEmulators)
    $rootScope.$apply()
  })

  socket.on('user.keys.adb.error', function(error) {
    $rootScope.$broadcast('user.keys.adb.error', error)
  })

  socket.on('user.keys.adb.added', function(key) {
    UserService.getAdbKeys().push(key)
    $rootScope.$broadcast('user.keys.adb.updated', user.adbKeys)
    $rootScope.$apply()
  })

  socket.on('user.keys.adb.removed', function(key) {
    user.adbKeys = UserService.getAdbKeys().filter(function(someKey) {
      return someKey.fingerprint !== key.fingerprint
    })
    $rootScope.$broadcast('user.keys.adb.updated', user.adbKeys)
    $rootScope.$apply()
  })

  socket.on('user.keys.adb.confirm', function(data) {
    AddAdbKeyModalService.open(data).then(function(result) {
      if (result) {
        UserService.acceptAdbKey(data)
      }
    })
  })

  return UserService
}
