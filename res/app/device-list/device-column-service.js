var _ = require('lodash')

var filterOps = {
  '<': function(a, filterValue) {
    return a < filterValue
  }
  , '<=': function(a, filterValue) {
    return a <= filterValue
  }
  , '>': function(a, filterValue) {
    return a > filterValue
  }
  , '>=': function(a, filterValue) {
    return a >= filterValue
  }
  , '=': function(a, filterValue) {
    return a === filterValue
  }
}

module.exports = function DeviceColumnService($filter, gettext) {
  // Definitions for all possible values.
  return {
    state: DeviceStatusCell({
      title: gettext('Status')
    , value: function(device) {
        return $filter('translate')(device.enhancedStateAction)
      }
    })
  , model: DeviceModelCell({
      title: gettext('Model')
    , value: function(device) {
        return device.model || device.serial
      }
    })
  , name: TextCell({
      title: gettext('Product')
    , value: function(device) {
        return device.name || ''
      }
    })
  , operator: TextCell({
      title: gettext('Carrier')
    , value: function(device) {
        return device.operator || ''
      }
    })
  , releasedAt: DateCell({
      title: gettext('Released')
    , value: function(device) {
        return device.releasedAt ? new Date(device.releasedAt) : null
      }
    })
  , version: TextCell({
      title: gettext('OS')
    , value: function(device) {
        return device.version || ''
      }
    , compare: function(deviceA, deviceB) {
        var va = (deviceA.version || '0').split('.')
          , vb = (deviceB.version || '0').split('.')
          , la = va.length
          , lb = vb.length

        for (var i = 0, l = Math.max(la, lb); i < l; ++i) {
          var a = i < la ? parseInt(va[i], 10) : 0
            , b = i < lb ? parseInt(vb[i], 10) : 0
            , diff = a - b

          if (diff !== 0) {
            return diff
          }
        }

        return 0
      }
    , filter: function(device, filter) {
        var va = (device.version || '0').split('.')
          , vb = (filter.query || '0').split('.')
          , la = va.length
          , lb = vb.length
          , op = filterOps[filter.op || '=']

        if (vb[lb - 1] === '') {
          // This means that the query is not complete yet, and we're
          // looking at something like "4.", which means that the last part
          // should be ignored.
          vb.pop()
          lb -= 1
        }

        for (var i = 0, l = Math.min(la, lb); i < l; ++i) {
          var a = parseInt(va[i], 10)
            , b = parseInt(vb[i], 10)

          if (!op(a, b)) {
            return false
          }
        }

        return true
      }
    })
  , network: TextCell({
      title: gettext('Network')
    , value: function(device) {
        return device.phone ? device.phone.network : ''
      }
    })
  , display: TextCell({
      title: gettext('Screen')
    , defaultOrder: 'desc'
    , value: function(device) {
        return device.display && device.display.width
          ? device.display.width + 'x' + device.display.height
          : ''
      }
    , compare: function(deviceA, deviceB) {
        var va = deviceA.display && deviceA.display.width
          ? deviceA.display.width * deviceA.display.height
          : 0
        var vb = deviceB.display && deviceB.display.width
          ? deviceB.display.width * deviceB.display.height
          : 0
        return va - vb
      }
    })
  , serial: TextCell({
      title: gettext('Serial')
    , value: function(device) {
        return device.serial || ''
      }
    })
  , manufacturer: TextCell({
      title: gettext('Manufacturer')
    , value: function(device) {
        return device.manufacturer || ''
      }
    })
  , sdk: NumberCell({
      title: gettext('SDK')
    , defaultOrder: 'desc'
    , value: function(device) {
        return device.sdk || ''
      }
    })
  , abi: TextCell({
      title: gettext('ABI')
    , value: function(device) {
        return device.abi || ''
      }
    })
  , phone: TextCell({
      title: gettext('Phone')
    , admin: true
    , value: function(device) {
        return device.phone ? device.phone.phoneNumber : ''
      }
    })
  , imei: TextCell({
      title: gettext('Phone IMEI')
    , admin: true
    , value: function(device) {
        return device.phone ? device.phone.imei : ''
      }
    })
  , iccid: TextCell({
      title: gettext('Phone ICCID')
    , admin: true
    , value: function(device) {
        return device.phone ? device.phone.iccid : ''
      }
    })
  , batteryHealth: TextCell({
      title: gettext('Battery Health')
    , admin: true
    , value: function(device) {
        return device.battery
          ? $filter('translate')(device.enhancedBatteryHealth)
          : ''
      }
    })
  , batterySource: TextCell({
      title: gettext('Battery Source')
    , admin: true
    , value: function(device) {
        return device.battery
          ? $filter('translate')(device.enhancedBatterySource)
          : ''
      }
    })
  , batteryStatus: TextCell({
      title: gettext('Battery Status')
    , admin: true
    , value: function(device) {
        return device.battery
          ? $filter('translate')(device.enhancedBatteryStatus)
          : ''
      }
    })
  , batteryLevel: TextCell({
      title: gettext('Battery Level')
    , admin: true
    , value: function(device) {
        return device.battery
          ? Math.floor(device.battery.level / device.battery.scale * 100) + '%'
          : ''
      }
    })
  , batteryTemp: TextCell({
      title: gettext('Battery Temp')
    , admin: true
    , value: function(device) {
        return device.battery ? device.battery.temp + '°C' : ''
      }
    })
  , provider: TextCell({
      title: gettext('Location')
    , value: function(device) {
        return device.provider ? device.provider.name : ''
      }
    })
  , owner: LinkCell({
      title: gettext('User')
    , target: '_blank'
    , value: function(device) {
        return device.owner ? device.owner.name : ''
      }
    , link: function(device) {
        return device.owner ? device.enhancedUserContactUrl : ''
      }
    })
  }
}

function zeroPadTwoDigit(digit) {
  return digit < 10 ? '0' + digit : '' + digit
}

function compareIgnoreCase(a, b) {
  var la = (a || '').toLowerCase()
    , lb = (b || '').toLowerCase()
  return la === lb ? 0 : (la < lb ? -1 : 1)
}

function filterIgnoreCase(a, filterValue) {
  var va = (a || '').toLowerCase()
    , vb = filterValue.toLowerCase()
  return va.indexOf(vb) !== -1
}

function compareRespectCase(a, b) {
  return a === b ? 0 : (a < b ? -1 : 1)
}



function TextCell(options) {
  return _.defaults(options, {
    title: options.title
  , admin: options.admin
  , defaultOrder: 'asc'
  , build: function () {
      var td = document.createElement('td')
      td.appendChild(document.createTextNode(''))
      return td
    }
  , update: function(td, item) {
      var t = td.firstChild
      t.nodeValue = options.value(item)
      return td
    }
  , compare: function(a, b) {
      return compareIgnoreCase(options.value(a), options.value(b))
    }
  , filter: function(item, filter) {
      return filterIgnoreCase(options.value(item), filter.query)
    }
  })
}

function NumberCell(options) {
  return _.defaults(options, {
    title: options.title
  , defaultOrder: 'asc'
  , build: function () {
      var td = document.createElement('td')
      td.appendChild(document.createTextNode(''))
      return td
    }
  , update: function(td, item) {
      var t = td.firstChild
      t.nodeValue = options.value(item)
      return td
    }
  , compare: function(a, b) {
      return options.value(a) - options.value(b)
    }
  , filter: (function() {
      return function(item, filter) {
        return filterOps[filter.op || '='](
          options.value(item)
        , +filter.query
        )
      }
    })()
  })
}

function DateCell(options) {
  return _.defaults(options, {
    title: options.title
  , defaultOrder: 'desc'
  , build: function () {
      var td = document.createElement('td')
      td.appendChild(document.createTextNode(''))
      return td
    }
  , update: function(td, item) {
      var t = td.firstChild
        , date = options.value(item)
      if (date) {
        t.nodeValue = date.getFullYear()
          + '-'
          + zeroPadTwoDigit(date.getMonth() + 1)
          + '-'
          + zeroPadTwoDigit(date.getDate())
      }
      else {
        t.nodeValue = ''
      }
      return td
    }
  , compare: function(a, b) {
      var va = options.value(a) || 0
        , vb = options.value(b) || 0
      return va - vb
    }
  , filter: (function() {
      function dateNumber(d) {
        return d
          ? d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate()
          : 0
      }
      return function(item, filter) {
        var filterDate = new Date(filter.query)
          , va = dateNumber(options.value(item))
          , vb = dateNumber(filterDate)
        return filterOps[filter.op || '='](va, vb)
      }
    })()
  })
}

function LinkCell(options) {
  return _.defaults(options, {
    title: options.title
  , defaultOrder: 'asc'
  , build: function () {
      var td = document.createElement('td')
        , a = document.createElement('a')
      a.appendChild(document.createTextNode(''))
      td.appendChild(a)
      return td
    }
  , update: function(td, item) {
      var a = td.firstChild
        , t = a.firstChild
        , href = options.link(item)
      if (href) {
        a.setAttribute('href', href)
      }
      else {
        a.removeAttribute('href')
      }
      a.target = options.target || ''
      t.nodeValue = options.value(item)
      return td
    }
  , compare: function(a, b) {
      return compareIgnoreCase(options.value(a), options.value(b))
    }
  , filter: function(item, filter) {
      return filterIgnoreCase(options.value(item), filter.query)
    }
  })
}

function DeviceModelCell(options) {
  return _.defaults(options, {
    title: options.title
  , defaultOrder: 'asc'
  , build: function() {
      var td = document.createElement('td')
        , span = document.createElement('span')
        , image = document.createElement('img')
        , a = document.createElement('a')
      span.className = 'device-small-image'
      image.className = 'device-small-image-img pointer'
      span.appendChild(image)
      td.appendChild(span)
      a.appendChild(document.createTextNode(''))
      td.appendChild(a)
      return td
    }
  , update: function(td, device) {
      var span = td.firstChild
        , image = span.firstChild
        , a = span.nextSibling
        , t = a.firstChild
        , src = '/static/app/devices/icon/x24/' +
            (device.image || '_default.jpg')
      // Only change if necessary so that we don't trigger a download
      if (image.getAttribute('src') !== src) {
        image.setAttribute('src', src)
      }

      if (device.using) {
        a.className = 'btn btn-xs btn-primary-outline'
        a.href = '#!/control/' + device.serial
      }
      else {
        a.className = 'device-model-link-off'
        a.removeAttribute('href')
      }

      t.nodeValue = options.value(device)
      return td
    }
  , compare: function(a, b) {
      return compareRespectCase(options.value(a), options.value(b))
    }
  , filter: function(device, filter) {
      return filterIgnoreCase(options.value(device), filter.query)
    }
  })
}

function DeviceStatusCell(options) {
  return _.defaults(options, {
    title: options.title
  , defaultOrder: 'asc'
  , build: function() {
      var td = document.createElement('td')
        , a = document.createElement('a')
      a.appendChild(document.createTextNode(''))
      td.appendChild(a)
      return td
    }
  , update: function(td, device) {
      var a = td.firstChild
        , t = a.firstChild
        , classes = 'btn btn-xs device-status '
      switch (device.state) {
      case 'using':
        a.className = classes + 'btn-primary'
        break
      case 'busy':
        a.className = classes + 'btn-warning'
        break
      case 'available':
      case 'ready':
      case 'present':
        a.className = classes + 'btn-primary-outline'
        break
      case 'preparing':
        a.className = classes + 'btn-primary-outline btn-success-outline'
        break
      case 'unauthorized':
        a.className = classes + 'btn-danger-outline'
        break
      case 'offline':
        a.className = classes + 'btn-warning-outline'
        break
      default:
        a.className = classes + 'btn-default-outline'
        break
      }
      if (device.usable && !device.using) {
        a.href = '#!/control/' + device.serial
      }
      else {
        a.removeAttribute('href')
      }
      t.nodeValue = options.value(device)
      return td
    }
  , compare: (function() {
      var order = {
        using: 10
      , available: 20
      , busy: 30
      , ready: 40
      , preparing: 50
      , unauthorized: 60
      , offline: 70
      , present: 80
      , absent: 90
      }
      return function(deviceA, deviceB) {
        return order[deviceA.state] - order[deviceB.state]
      }
    })()
  , filter: function(device, filter) {
      return device.state === filter.query
    }
  })
}
