var os = require('os')
var fs = require('fs')
var connect = require('net')
var Promise = require('bluebird')

var logger = require('./logger')
var dbapi = require('../db/api')
var devutil = require('./devutil')

var log = logger.createLogger('util:deviceutil')

var deviceutil = module.exports = Object.create(null)

deviceutil.isOwnedByUser = function(device, user) {
  return device.present &&
         device.ready &&
         device.owner &&
         device.owner.email === user.email &&
         device.using
}

deviceutil.isAddable = function(device, user) {
  return device.present &&
         device.ready &&
         !device.using &&
         !device.owner
}


function createEmulatorBasicData(emuName, provider, freePort) {
 dbapi.saveDeviceInitialState(provider + '-' + freePort, {
      provider: {
        name: provider
      , channel: '*fake'
      }
    , status: 'OFFLINE'
    })
    .then(function() {
      dbapi.saveDeviceIdentity(provider + '-' + freePort, {
        platform: 'Android'
      , emulatorName: emuName.replace(/\s/g, '')
      , emulatorArgs: '-wipe-data -no-boot-anim -no-window'
      , manufacturer: 'Android Emulator AVD'
      , operator: 'STF AVD'
      , model: 'Emulator'
      , version: 'ToBeSet'
      , abi: 'ToBeSet'
      , sdk: 8 + Math.floor(Math.random() * 12)
      , display: {
          density: 3
        , fps: 60
        , height: 1920
        , id: 0
        , rotation: 0
        , secure: true
        , url: '/404.jpg'
        , width: 1080
        , xdpi: 442
        , ydpi: 439
        }
      , phone: {
          iccid: 'ToBeSet'
        , imei: 'ToBeSet'
        , imsi: 'ToBeSet'
        , network: 'LTE'
        , phoneNumber: 'ToBeSet'
        }
      , product: 'Emulator'
      })
 })
 .then(function() {
      return dbapi.setDeviceAbsent(provider + '-' + freePort)
    })
}

function getEmulatorNames(sdkPath, binaryOSName) {
  var cmdExec = require('node-cmd')
  var cmd = sdkPath + binaryOSName + ' list avd'
  cmdExec.get(
    cmd,
    function(err, data, stderr) {
      var deviceArrayCollectedFromCallListAVD = []
      var hostname = os.hostname()
      if (err) {
        log.info('Err:' + err.toString())
      }

      try{
        var telnetDeviceList = data.toString().split('Android Virtual' +
                                                    'Devices:').pop(-1).split('---------')
        for (var i = 0; i < telnetDeviceList.length; i++) {
          var emuTelnetOutput = telnetDeviceList[i].split('\n')
          var telnetDeviceInfo = Object.create(null)
          for (var line = 0; line < emuTelnetOutput.length; line++) {
            var tmpArray = emuTelnetOutput[line].split(':')
            if (typeof tmpArray[1] === 'undefined') {
              telnetDeviceInfo[tmpArray[0].replace(/\s/g, '')] = tmpArray[1]
            }
            else {
              telnetDeviceInfo[tmpArray[0].replace(/\s/g, '')] = tmpArray[1].replace(/\s/g, '')
            }
          }
          deviceArrayCollectedFromCallListAVD.push(telnetDeviceInfo)
        }

        dbapi.getDiscoveredEmulators().then(function(cursor) {
          return Promise.promisify(cursor.toArray, cursor)().then(function(list) {
            var deviceListCollectedFromDB = []
            list.forEach(function(device) {
              deviceListCollectedFromDB.push(device)
            })
            var uniqueDeviceOnProvider = deviceArrayCollectedFromCallListAVD
            var occupiedPort = []
            for(var deviceIDX = 0; deviceIDX < deviceListCollectedFromDB.length; deviceIDX++) {
              if(typeof deviceListCollectedFromDB[deviceIDX].emulatorName !== 'undefined') {
                for(var emulatorIDX = 0; emulatorIDX < deviceArrayCollectedFromCallListAVD.length;
                    emulatorIDX++) {
                  if ((deviceListCollectedFromDB[deviceIDX].emulatorName.replace(/\s/g, '') ===
                       deviceArrayCollectedFromCallListAVD[emulatorIDX].Name.replace(/\s/g, '')) &&
                       (deviceListCollectedFromDB[deviceIDX].provider.name === hostname)) {
                    occupiedPort.push(
                      parseInt(deviceListCollectedFromDB[deviceIDX].serial.split('-').pop(-1), 10))
                    for (var tmpIDX = 0; tmpIDX < uniqueDeviceOnProvider.length; tmpIDX++) {
                      if(uniqueDeviceOnProvider[tmpIDX] ===
                         deviceArrayCollectedFromCallListAVD[emulatorIDX]) {
                        uniqueDeviceOnProvider.splice(tmpIDX, 1)
                      }
                    }
                  }
                }
              }
            }
            if (uniqueDeviceOnProvider.length > 0) {
              log.info('STF devices table is missing information about : ' +
                       JSON.stringify(uniqueDeviceOnProvider))

              occupiedPort.sort()
              var adbPort = 5554
              var checkFlag = true
              for(var missingDeviceIDX = 0; missingDeviceIDX < uniqueDeviceOnProvider.length;
                  missingDeviceIDX++) {
                while(checkFlag) {
                  if(!occupiedPort.includes(adbPort)) {
                    log.info('Adding new emulator to db: ' +
                     uniqueDeviceOnProvider[missingDeviceIDX].Name)
                    createEmulatorBasicData(uniqueDeviceOnProvider[missingDeviceIDX].Name, hostname,
                     adbPort.toString())
                    occupiedPort.push(adbPort)
                    checkFlag = false
                  }

                  /*
                  Increase port on which we can work by increments of two as is described when we call
                  ```
                    emulator -help-port
                  ```
                  */

                  adbPort += 2
                }
                checkFlag = true
              }
            }
          })
        })
      }
      catch(err) {
        log.info('Error :' + err)
      }
    })
  }


deviceutil.getAVDNames = function() {
  var binaryOSName = 'android'
  if (os.type() === 'Windows_NT') {
    binaryOSName = 'android.exe'
  }

  if (devutil.androidSDKFileSexists(
    process.env.ANDROID_HOME + '/tools/' + binaryOSName) === true) {
    var androidSdkPath = process.env.ANDROID_HOME + '/tools/'
    getEmulatorNames(androidSdkPath, binaryOSName)
  }
}

deviceutil.startEmulator = function(sdkPath, binaryOSName, name, port, execArgs) {
      var cmdExec = require('node-cmd')
      var cmd = sdkPath + binaryOSName + ' -avd ' + name +
                ' -port ' + port + ' ' + execArgs
      cmdExec.get(
        cmd,
        function(err, data, stderr) {
          try{
            log.info('Err:' + err.toString())
          }
          catch (err) {
            return true
          }

          try{
            var outputData = data.toString()
            if (outputData.indexOf('another emulator instance running' +
                ' with the current AVD') > -1) {
              deviceutil.killSelectedEmulator(port)
              deviceutil.startEmulator(sdkPath, binaryOSName, name,
                                       port, execArgs)
            }
          }
          catch (err) {
            return true
          }
        }
      )
    }

deviceutil.restartEmulatorByName = function(emuName, port, execArgs) {
  var binaryOSName = 'emulator'
  if (os.type() === 'Windows_NT') {
    binaryOSName = 'emulator.exe'
  }

  if (devutil.androidSDKFileSexists(process.env.ANDROID_HOME + '/tools/' +
      binaryOSName) === true) {
    var androidSdkPath = process.env.ANDROID_HOME + '/tools/'
    deviceutil.startEmulator(androidSdkPath, binaryOSName, emuName, port, execArgs)
    }
}

deviceutil.killSelectedEmulator = function(port) {
  var cmd = 'kill\r\nexit\r'
  var client = new connect.Socket()
  client.connect(port, 'localhost', () => {
    client.write(cmd)
  })
}

deviceutil.getRunningAVDName = function(serial, provider) {
  var cmd = 'avd name\r\nexit\r\n'
  var client = new connect.Socket()
  var emulatorSerial = serial
  client.connect(emulatorSerial.split('-')[1], 'localhost', () => {
    log.info('Connected to server')
    client.write(cmd)
  })

  client.on('data', (data) => {
    var emuName = data.toString().split('\n')[2].replace('\r', '')
    log.info('[' + emulatorSerial + '] emulator has name: ' + emuName)
    if (emuName.length > 0) {
      if (emulatorSerial.indexOf('-') !== -1) {
        emulatorSerial = provider + '-' + emulatorSerial.split('-').pop(-1)
        log.info('New serial is :' + emulatorSerial)
      }
      dbapi.setDeviceEmulatorName(emulatorSerial, emuName.replace(/\s/g, ''))
      }
    return emuName
  })
}
