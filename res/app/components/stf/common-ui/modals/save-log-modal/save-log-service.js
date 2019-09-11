var FileSaver = require('file-saver')

module.exports =
  function SaveLogsServiceFactory($uibModal, $location, $route) {
    var SaveLogService = {}
    var logExtentension = ['json', 'log']
    var selectedExtension = logExtentension[0]

    function parseLogsToDefinedExtenstion(device, logExtension, lineLimitation) {
      var lineLimiter = ((isNaN(lineLimitation)) ? device.length : lineLimitation)
      var output = ''
      if (device.length > 0) {
        if (logExtension === 'log') {
          for (let line = 0; line < lineLimiter; line++) {
            output += [device[line].date, device[line].pid,
                      device[line].tag, device[line].priorityLabel,
                      device[line].message].join('\t') + '\n'
          }
        } else {
          output = {'deviceOS': device[0].deviceLabel,
                    'serial': device[0].serial,
                    'logs': []}
          for (let line = 0; line < lineLimiter; line++) {
            output.logs.push({'date': device[line].date,
                              'pid': device[line].pid,
                              'tag': device[line].tag,
                              'priorityLabel': device[line].priorityLabel,
                              'message': device[line].message})
          }
        }
      }
      return output
    }

    function createSamplePresentation(device, logExtension, scope) {
      var toSave = parseLogsToDefinedExtenstion(device,
        logExtension, 4)
      if (toSave.length > 0 || typeof toSave === 'object') {
        switch(logExtension) {
          case 'json':
            scope.samplePresentation = JSON.stringify(toSave)
            break
          case 'log':
            scope.samplePresentation = toSave
            break
          default:
            scope.samplePresentation = toSave
            break
        }
      }
    }

    var ModalInstanceCtrl = function($scope, $uibModalInstance, device) {
      $scope.ok = function() {
        $uibModalInstance.close(true)
        $route.reload()
      }

      $scope.logExtentension = logExtentension
      $scope.selectedExtension = $scope.logExtentension[0]

      createSamplePresentation(device, $scope.selectedExtension, $scope)

      $scope.second = function() {
        $uibModalInstance.dismiss()
        $location.path('/devices/')
      }

      $scope.cancel = function() {
        $uibModalInstance.dismiss('cancel')
      }

      $scope.saveLogs = function() {
        var parsedOutput = NaN

        switch(selectedExtension) {
          case 'json':
              parsedOutput = new Blob(
                [JSON.stringify(parseLogsToDefinedExtenstion(device, selectedExtension))],
                {type: 'application/json;charset=utf-8'})
              break
          case 'log':
              parsedOutput = new Blob(
                [parseLogsToDefinedExtenstion(device, selectedExtension)],
                {type: 'text/plain;charset=utf-8'})
              break
          default:
              // ToDo
              // Add support for other types
              // Ad-hoc save file as plain text
              parsedOutput = new Blob(
                [parseLogsToDefinedExtenstion(device, selectedExtension)],
                {type: 'text/plain;charset=utf-8'})
              break
        }

        if (typeof $scope.saveLogFileName === 'undefined' ||
          $scope.saveLogFileName.length === 0) {
          FileSaver.saveAs(parsedOutput,
            (window.location.href).split('/').pop() + '_logs.' + selectedExtension)
        }
         else {
          FileSaver.saveAs(parsedOutput,
            $scope.saveLogFileName + '.' + selectedExtension)
        }
        $uibModalInstance.dismiss('cancel')
      }

      $scope.$watch('selectedExtension', function(newValue, oldValue) {
        if (newValue !== oldValue) {
          selectedExtension = newValue
          createSamplePresentation(device, newValue, $scope)
        }
      })
    }

    SaveLogService.open = function(device, tryToReconnect) {
      var modalInstance = $uibModal.open({
        template: require('./save-log.pug'),
        controller: ModalInstanceCtrl,
        resolve: {
          device: function() {
            return device
          },
          tryToReconnect: function() {
            return tryToReconnect
          }
        }
      })

      modalInstance.result.then(function() {
      }, function() {

      })
    }


    return SaveLogService
  }
