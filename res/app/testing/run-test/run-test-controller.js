module.exports = function RunTestCtrl($window, $scope, $rootScope, DeviceService,
                                      CommandExecutorService, TestingToolsService,
                                      EmulatorService, StorageService) {

  // Only track usable and present devices
  $scope.groupTracker = DeviceService.trackFiltered($scope, getOnlyUsableDevices)
  $scope.groupTracker.on('change', devicesChangeListener)
  $scope.devices = $scope.groupTracker.devices
  $scope.emulators = []
  $scope.infoText = ''

  $scope.configs = []
  $scope.configSelected = 0
  $scope.numberOfRetriesOnFailure = 0

  let defaultColumns = [
    {
      name: 'chosen'
      , selected: true
    }
    , {
      name: 'state'
      , selected: true
    }
    , {
      name: 'model'
      , selected: true
    }
    , {
      name: 'name'
      , selected: true
    }
    , {
      name: 'serial'
      , selected: false
    }
    , {
      name: 'operator'
      , selected: true
    }
    , {
      name: 'releasedAt'
      , selected: false
    }
    , {
      name: 'version'
      , selected: true
    }
    , {
      name: 'network'
      , selected: false
    }
    , {
      name: 'display'
      , selected: false
    }
    , {
      name: 'manufacturer'
      , selected: false
    }
    , {
      name: 'sdk'
      , selected: false
    }
    , {
      name: 'abi'
      , selected: false
    }
    , {
      name: 'cpuPlatform'
      , selected: false
    }
    , {
      name: 'openGLESVersion'
      , selected: false
    }
    , {
      name: 'browser'
      , selected: false
    }
    , {
      name: 'phone'
      , selected: false
    }
    , {
      name: 'imei'
      , selected: false
    }
    , {
      name: 'imsi'
      , selected: false
    }
    , {
      name: 'iccid'
      , selected: false
    }
    , {
      name: 'batteryHealth'
      , selected: false
    }
    , {
      name: 'batterySource'
      , selected: false
    }
    , {
      name: 'batteryStatus'
      , selected: false
    }
    , {
      name: 'batteryLevel'
      , selected: false
    }
    , {
      name: 'batteryTemp'
      , selected: false
    }
    , {
      name: 'provider'
      , selected: false
    }
    , {
      name: 'notes'
      , selected: true
    }
    , {
      name: 'owner'
      , selected: true
    }
  ]

  $scope.columns = defaultColumns

  let defaultSort = {
    fixed: [
      {
        name: 'state'
        , order: 'asc'
      }
    ]
    , user: [
      {
        name: 'name'
        , order: 'asc'
      }
    ]
  }

  $scope.sort = defaultSort

  $scope.filter = []
  $scope.info = ''

  let storageId = null
  $scope.pressedTest = false
  $scope.numberOfTests = 1
  $scope.tests = {runs: []}

  $scope.generalInfoId = -1
  $scope.generalInfoResult = 'General information:\n'

  function updateTestingTools() {
    TestingToolsService.getTestingTools().success(function(response) {
      response.testingTools.map(function(config) {
        // Be aware that there are also setup parameters already
        config.toolParameters = ''
      })
      $scope.configs = response.testingTools
      updateInfoText()
    })
  }

  function updateEmulators() {
    $scope.emulators = EmulatorService.getEmulators()
    updateInfoText()
  }

  function updateInfoText() {
    let msg = ''
    if ($scope.noToolSelected()) {
      msg = 'Add a tool in order to test.'
    } else if (!areDevicesAvailable()) {
      msg = 'Select devices or configure emulators in order to test.'
    } else if ($scope.upload && $scope.upload.state === 'uploading') {
      msg = 'Waiting for the upload to finish.'
    } else if ($scope.numberOfTests < numberOfOverallDevices()) {
      msg = 'Number of test runs must be equal or greater than the number of devices.'
    } else {
      msg = ''
    }
    $scope.infoText = msg
  }

  function getDeviceSerials() {
    return getPhysicalDevices().map(function(device) {
      return {serial: device.serial}
    })
  }

  /**
   * Only return physical devices, which are selected by the user, i.e. ticked by the checkbox.
   */
  function getPhysicalDevices() {
    return $scope.devices.filter(device => device.chosen)
  }

  function areDevicesAvailable() {
    return numberOfOverallDevices() > 0
  }

  function numberOfOverallDevices() {
    let emulatorNum = 0
    $scope.emulators.forEach(function(emu) {
      emulatorNum += emu.numberEmulators
    })
    return emulatorNum + getPhysicalDevices().length
  }

  /**
   * TODO:
   * - After clicking test, lock maybe more than just the checkboxes
   */
  $scope.test = function() {
    if ($scope.numberOfTests < numberOfOverallDevices()) {
      throw new Error('Number of tests must be bigger than the number of devices.')
    }

    $scope.pressedTest = true
    const configSelected = $scope.configs[$scope.configSelected]
    $scope.tests.devices = getDeviceSerials()
    $scope.tests.emulators = $scope.emulators
    $scope.tests.numberOfRetriesOnFailure = $scope.numberOfRetriesOnFailure
    $scope.tests.config = configSelected

    CommandExecutorService.executeTestingTools($scope.tests, storageId)
  }

  $scope.uploadFile = function($files) {
    if ($files.length) {
      $scope.upload = {state: 'uploading'}
      $scope.upload.progress = 0
      return StorageService.storeFile('apk', $files, {
        filter: function(file) {
          return /\.(apk|zip)$/i.test(file.name)
        }
      }, true)
        .progressed(function(e) {
          if (e.lengthComputable) {
            $scope.upload.progress = (e.loaded / e.total * 100).toFixed(2)
          }
        })
        .then(function(res) {
          storageId = res.data.resources.file.id
          $scope.upload.progress = 100
          $scope.upload.state = 'installed'
          $scope.upload.settled = true
          updateInfoText()
          $scope.$digest()
        })
        .catch(function(err) {
          $scope.upload.error = err.code || err.message
        })
    }
  }

  $scope.updateNumberOfTests = function() {
    if ($scope.numberOfTests < numberOfOverallDevices()) {
      $scope.numberOfTests = numberOfOverallDevices()
    }
    $scope.tests.runs = Array.apply(null, Array($scope.numberOfTests)).map(function(test, index) {
      return {id: index, finished: false, result: '', error: ''}
    })
  }

  $scope.removeTestingTool = function(config) {
    if (confirm('Do you want to remove the testing tool?')) {
      TestingToolsService.removeTestingTool(config)
    }
  }

  $scope.removeEmulator = function(index) {
    this.emulators.splice(index, 1)
  }

  $scope.updateConfigSelected = function(index) {
    $scope.configSelected = index
  }

  $scope.downloadTestResults = function() {
    location.href = '/s/download/report/' + storageId + '?download'
  }

  $scope.$on('command.testing.tools.message', function(event, msg) {
    if (msg.id === $scope.generalInfoId) {
      $scope.generalInfoResult += msg.message + '\n'
    } else {
      $scope.tests.runs[msg.id].result += msg.message
    }
  })

  $scope.$on('command.testing.tools.finished', function(event, msg) {
    $scope.tests.runs[msg.id].finished = true
    $scope.generalInfoResult += 'Test run #' + msg.id + ' finished.\n'
  })

  $scope.$on('command.testing.tools.error', function(event, msg) {
    $scope.$apply(function() {
      if (msg.id === $scope.generalInfoId) {
        $scope.generalInfoResult += msg.message + '\n'
      } else {
        $scope.tests.runs[msg.id].error += msg.message
      }
    })
  })

  $scope.testFinished = function() {
    if ($scope.noToolSelected()) {
      return false
    }

    const finished = $scope.tests.runs.reduce(function(acc, run) {
      return acc && run.finished
    }, true)

    if (finished) {
      $scope.pressedTest = false
    }

    return finished
  }

  $scope.noToolSelected = function() {
    return $scope.configs.length === 0
  }

  /**
   * Check if the configuration is invalid and other value to enable the test button.
   */
  $scope.disableTestButton = function() {
    return $scope.noToolSelected()
      || $scope.pressedTest
      || !areDevicesAvailable()
      || $scope.upload && $scope.upload.state === 'uploading'
      || $scope.numberOfTests < numberOfOverallDevices()
  }

  $scope.$on('$locationChangeStart', function(event, next, current) {
    if ($scope.pressedTest
        && !confirm('Do you really want to change the page? You will lose the real-time information.')) {
      event.preventDefault()
    }
  })

  $window.onbeforeunload = function(event) {
    if ($scope.pressedTest) {
      return 'Do you really want to close or refresh the page? You will lose the real-time information.'
    }
  }

  function devicesChangeListener() {
    $scope.devices = $scope.groupTracker.devices
    updateInfoText()
    $scope.$digest()
  }

  function getOnlyUsableDevices(device) {
    return device.present && device.status === 3 && device.ready && device.using
  }

  $scope.$on('testing.tool.updated', updateTestingTools)
  $scope.$on('testing.emulator.updated', updateEmulators)
  updateTestingTools()
  updateEmulators()
  updateInfoText()
  $scope.updateNumberOfTests()
}
