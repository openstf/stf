var logger = require('./logger')
var dbapi = require('../db/api')
var devutil = require('./devutil')
var os = require('os')
var fs = require('fs')
var connect = require('net')
var Promise = require('bluebird')

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

deviceutil.getAVDNames = function (){
      var binaryOSName = 'android';
      if ( os.type() === 'Windows_NT' ) {
          binaryOSName = 'android.exe'
      }

      if (devutil.ANDROIDSDKFileExists(process.env.ANDROID_HOME + '/tools/' + binaryOSName) === true) {
        var androidSdkPath = process.env.ANDROID_HOME + '/tools/'
        var cmdExec=require('node-cmd');
        function getEmulatorNames(sdk_path, binaryOSName) {
            var cmd = sdk_path + binaryOSName + ' list avd'
            cmdExec.get(
                cmd,
                function(err, data, stderr) {
                  var deviceArrayCollectedFromCallListAVD = []
                  var hostname = os.hostname()
                  if (err) {
                    log.info("Err:" + err.toString())
                  }

                  try{
                    var device_list = data.toString().split('Android Virtual Devices:').pop(-1).split('---------')
                    for( var i=0; i < device_list.length ; i++) {
                      var emulator_body = device_list[i].split('\n')
                      var dev_obj =  Object.create(null)
                      for (line=0; line < emulator_body.length; line++){
                        var tmp_array = emulator_body[line].split(':')
                        if (typeof tmp_array[1] === 'undefined') {
                          dev_obj[tmp_array[0].replace(/\s/g,'')] = tmp_array[1]
                        } else {
                          dev_obj[tmp_array[0].replace(/\s/g,'')] = tmp_array[1].replace(/\s/g,'')
                        }
                      }
                      deviceArrayCollectedFromCallListAVD.push(dev_obj)
                    }

                    dbapi.loadDevices()
                        .then(function(cursor) {
                          return Promise.promisify(cursor.toArray, cursor)()
                            .then(function(list) {
                              var deviceListCollectedFromDB = []

                              list.forEach(function(device) {
                                deviceListCollectedFromDB.push(device)
                              })
                              var uniqueDeviceOnProvider = deviceArrayCollectedFromCallListAVD
                              var deviceExist = []
                              var occupiedPort = []
                              for(var device_id = 0 ; device_id < deviceListCollectedFromDB.length ; device_id++) {
                                if(typeof(deviceListCollectedFromDB[device_id].emulatorName) !== 'undefined') {
                                  for(var emulator_id = 0; emulator_id < deviceArrayCollectedFromCallListAVD.length ; emulator_id++) {
                                    if ((deviceListCollectedFromDB[device_id].emulatorName.replace(/\s/g,'') === deviceArrayCollectedFromCallListAVD[emulator_id].Name.replace(/\s/g,''))
                                        && (deviceListCollectedFromDB[device_id].provider.name === hostname)){
                                        occupiedPort.push(parseInt(deviceListCollectedFromDB[device_id].serial.split('-').pop(-1)))
                                        for (var tmp_id = 0 ; tmp_id < uniqueDeviceOnProvider.length; tmp_id ++) {
                                          if(uniqueDeviceOnProvider[tmp_id] == deviceArrayCollectedFromCallListAVD[emulator_id]){
                                            uniqueDeviceOnProvider.splice(tmp_id, 1)
                                          }
                                        }
                                    }
                                  }
                                }
                              }
                              if (uniqueDeviceOnProvider.length > 0 ){
                                log.info("STF devices table is missing information about : " + JSON.stringify(uniqueDeviceOnProvider));

                                occupiedPort.sort();
                                var adbPort = 5554
                                var checkFlag = true
                                for(var missing_device_id = 0 ; missing_device_id < uniqueDeviceOnProvider.length ; missing_device_id ++) {
                                  while(checkFlag){
                                    if(!occupiedPort.includes(adbPort)){
                                        log.info("Adding new emulator to db: " + uniqueDeviceOnProvider[missing_device_id].Name)
                                        createEmulatorBasicData(uniqueDeviceOnProvider[missing_device_id].Name, hostname, adbPort.toString())
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

                  } catch (err) {
                  log.info("Error :" +  err)
                  }
                }
            )
          }
       getEmulatorNames(androidSdkPath, binaryOSName)
        }
}

deviceutil.restartEmulatorByName = function (emulator_name, port) {
  var binaryOSName = 'emulator';
  if ( os.type() === 'Windows_NT' ) {
      binaryOSName = 'emulator.exe'
  }

  if (devutil.ANDROIDSDKFileExists(process.env.ANDROID_HOME + '/tools/' + binaryOSName) === true) {
    var androidSdkPath = process.env.ANDROID_HOME + '/tools/'
    var cmdExec=require('node-cmd');
    function startEmulator(sdk_path, binaryOSName, name, port) {
        var predefined_args = ' -wipe-data -no-boot-anim -no-window'
        var cmd = sdk_path + binaryOSName + ' -avd ' + name + ' -port ' + port + ' ' + predefined_args
        cmdExec.get(
            cmd,
            function(err, data, stderr) {

              try{
                log.info("Err:" + err.toString())
              } catch (err) {}

              try{
                output_data = data.toString()
                if (output_data.indexOf("another emulator instance running with the current AVD") > -1) {
                  deviceutil.killSelectedEmulator(port)
                  startEmulator(androidSdkPath, binaryOSName, emulator_name, port)
                  return 'end'
                }
              }
              catch (err) {}

            }
        )
      }
    startEmulator(androidSdkPath, binaryOSName, emulator_name, port)
  }
}

deviceutil.killSelectedEmulator = function (port) {
  var cmd = 'kill\r\nexit\r'
  var client = new connect.Socket()
  client.connect(port, 'localhost', () => {
    client.write(cmd)
  })
}

deviceutil.getRunningAVDName = function (serial, provider) {
  var cmd = 'avd name\r\nexit\r\n'
  var client = new connect.Socket()
  client.connect(serial.split('-')[1], 'localhost', () => {
    log.info('Connected to server')
    client.write(cmd)
  })

  client.on('data', (data) => {
    var emulator_name = data.toString().split('\n')[2].replace('\r','')
    log.info("["+ serial +"] emulator has name: " + emulator_name)
    if (emulator_name.length > 0 ) {
      if (serial.indexOf('-') !== -1){
        serial = provider + '-' + serial.split('-').pop(-1)
        log.info("New serial is :" + serial)
      }
      dbapi.setDeviceEmulatorName(serial, emulator_name.replace(/\s/g,''));
      }
    return emulator_name
  })
}

function createEmulatorBasicData(emulator_name, provider, freePort){
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
      , emulatorName: emulator_name.replace(/\s/g,'')
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
