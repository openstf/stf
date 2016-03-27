module.exports = function EnhanceDeviceServiceFactory($filter, AppState) {
  var service = {}

  function setState(data) {
    // For convenience, formulate an aggregate state property that covers
    // every possible state.
    data.state = 'absent'
    if (data.present) {
      data.state = 'present'
      switch (data.status) {
        case 1:
          data.state = 'offline'
          break
        case 2:
          data.state = 'unauthorized'
          break
        case 3:
          data.state = 'preparing'
          if (data.ready) {
            data.state = 'ready'
            if (data.using) {
              data.state = 'using'
            }
            else {
              if (data.owner) {
                data.state = 'busy'
              }
              else {
                data.state = 'available'
              }
            }
          }
          break
      }
    }
  }

  function enhanceDevice(device) {
    device.enhancedName = device.name || device.model || device.serial || 'Unknown'
    device.enhancedModel = device.model || 'Unknown'
    device.enhancedImage120 = '/static/app/devices/icon/x120/' + (device.image || '_default.jpg')
    device.enhancedImage24 = '/static/app/devices/icon/x24/' + (device.image || '_default.jpg')
    device.enhancedStateAction = $filter('statusNameAction')(device.state)
    device.enhancedStatePassive = $filter('statusNamePassive')(device.state)
  }

  function enhanceDeviceDetails(device) {
    if (device.battery) {
      device.enhancedBatteryPercentage = (device.battery.level / device.battery.scale * 100) + '%'
      device.enhancedBatteryHealth = $filter('batteryHealth')(device.battery.health)
      device.enhancedBatterySource = $filter('batterySource')(device.battery.source)
      device.enhancedBatteryStatus = $filter('batteryStatus')(device.battery.status)
      device.enhancedBatteryTemp = device.battery.temp + '°C'
    }

    if (device.owner) {
      device.enhancedUserProfileUrl = enhanceUserProfileUrl(device.owner.email)
      device.enhancedUserName = device.owner.name || 'No name'
    }
  }

  function enhanceUserProfileUrl(email) {
    var url
    var userProfileUrl = (function() {
      if (AppState && AppState.config && AppState.config.userProfileUrl) {
        return AppState.config.userProfileUrl
      }
      return null
    })()

    if (userProfileUrl) {
      // Using RFC 6570 URI Template specification
      if (userProfileUrl && email) {
        url = userProfileUrl.indexOf('{user}') !== -1 ?
          userProfileUrl.replace('{user}', email) :
          userProfileUrl + email
      }
    } else if (email.indexOf('@') !== -1) {
      url = 'mailto:' + email
    } else {
      url = '/!#/user/' + email
    }
    return url
  }

  service.enhance = function(device) {
    setState(device)
    enhanceDevice(device)
    enhanceDeviceDetails(device)
  }

  return service
}
