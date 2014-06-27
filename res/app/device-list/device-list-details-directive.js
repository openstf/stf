function zeroPadTwoDigit(digit) {
  return digit < 10 ? '0' + digit : '' + digit
}

function caseInsensitiveSort(prop) {
  return function(a, b) {
    return a[prop] === b[prop]
      ? 0
      : (a[prop] || '').toLowerCase() < (b[prop] || '').toLowerCase() ? -1 : 1
  }
}

function caseSensitiveSort(prop) {
  return function(a, b) {
    return a[prop] === b[prop]
      ? 0
      : (a[prop] || '') < (b[prop] || '') ? -1 : 1
  }
}

var stateSortOrder = {
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

var columns = {
  state: {
    build: function() {
      var td = document.createElement('td')
        , a = document.createElement('a')
      a.appendChild(document.createTextNode(''))
      td.appendChild(a)
      return td
    }
  , update: function(td, device) {
      var a = td.firstChild
        , t = a.firstChild
      a.href = '#!/control/' + device.serial
      t.nodeValue = device.state
      return td
    }
  , compare: function(deviceA, deviceB) {
      return stateSortOrder[deviceA.state] - stateSortOrder[deviceB.state]
    }
  }
, model: {
    build: function() {
      var td = document.createElement('td')
      var image = document.createElement('img')
      td.appendChild(image)
      td.appendChild(document.createTextNode(''))
      return td
    }
  , update: function(td, device) {
      var image = td.firstChild
        , t = image.nextSibling
      image.src = '/static/devices/icon/x24/' + (device.image || '_default.jpg')
      t.nodeValue = device.model || device.serial
    }
  , compare: caseSensitiveSort('model')
  }
, name: {
    build: function() {
      var td = document.createElement('td')
      td.appendChild(document.createTextNode(''))
      return td
    }
  , update: function(td, device) {
      var t = td.firstChild
      t.nodeValue = device.name || ''
    }
  , compare: caseInsensitiveSort('name')
  }
, operator: {
    build: function() {
      var td = document.createElement('td')
      td.appendChild(document.createTextNode(''))
      return td
    }
  , update: function(td, device) {
      var t = td.firstChild
      t.nodeValue = device.operator || ''
    }
  , compare: caseInsensitiveSort('operator')
  }
, releasedAt: {
    build: function() {
      var td = document.createElement('td')
      td.appendChild(document.createTextNode(''))
      return td
    }
  , update: function(td, device) {
      var t = td.firstChild
      if (device.releasedAt) {
        var date = new Date(device.releasedAt)
        t.nodeValue = date.getFullYear()
          + '-'
          + zeroPadTwoDigit(date.getMonth() + 1)
          + '-'
          + zeroPadTwoDigit(date.getDate())
      }
      else {
        t.nodeValue = ''
      }
    }
  , compare: caseSensitiveSort('releasedAt')
  }
, version: {
    build: function() {
      var td = document.createElement('td')
      td.appendChild(document.createTextNode(''))
      return td
    }
  , update: function(td, device) {
      var t = td.firstChild
      t.nodeValue = device.version || ''
    }
    // @TODO semver
  , compare: caseSensitiveSort('version')
  }
, network: {
    build: function() {
      var td = document.createElement('td')
      td.appendChild(document.createTextNode(''))
      return td
    }
  , update: function(td, device) {
      var t = td.firstChild
      t.nodeValue = device.network
        ? device.network.subtype || device.network.type || ''
        : ''
    }
  }
, display: {
    build: function() {
      var td = document.createElement('td')
      td.appendChild(document.createTextNode(''))
      return td
    }
  , update: function(td, device) {
      var t = td.firstChild
      t.nodeValue = device.display
        ? device.display.width + 'x' + device.display.height
        : ''
    }
  }
, serial: {
    build: function() {
      var td = document.createElement('td')
      td.appendChild(document.createTextNode(''))
      return td
    }
  , update: function(td, device) {
      var t = td.firstChild
      t.nodeValue = device.serial
    }
  }
, manufacturer: {
    build: function() {
      var td = document.createElement('td')
      td.appendChild(document.createTextNode(''))
      return td
    }
  , update: function(td, device) {
      var t = td.firstChild
      t.nodeValue = device.manufacturer || ''
    }
  }
, sdk: {
    build: function() {
      var td = document.createElement('td')
      td.appendChild(document.createTextNode(''))
      return td
    }
  , update: function(td, device) {
      var t = td.firstChild
      t.nodeValue = device.sdk || ''
    }
  }
, abi: {
    build: function() {
      var td = document.createElement('td')
      td.appendChild(document.createTextNode(''))
      return td
    }
  , update: function(td, device) {
      var t = td.firstChild
      t.nodeValue = device.abi || ''
    }
  }
, phone: {
    build: function() {
      var td = document.createElement('td')
      td.appendChild(document.createTextNode(''))
      return td
    }
  , update: function(td, device) {
      var t = td.firstChild
      t.nodeValue = device.phone
        ? device.phone.phoneNumber || ''
        : ''
    }
  }
, imei: {
    build: function() {
      var td = document.createElement('td')
      td.appendChild(document.createTextNode(''))
      return td
    }
  , update: function(td, device) {
      var t = td.firstChild
      t.nodeValue = device.phone
         ? device.phone.imei || ''
         : ''
    }
  }
, iccid: {
    build: function(device) {
      var td = document.createElement('td')
      if (device.phone) {
        td.appendChild(document.createTextNode(device.phone.iccid))
      }
      return td
    }
  }
, batteryHealth: {
    build: function(device) {
      var td = document.createElement('td')
      if (device.battery) {
        td.appendChild(document.createTextNode(device.battery.health))
      }
      return td
    }
  }
, batterySource: {
    build: function(device) {
      var td = document.createElement('td')
      if (device.battery) {
        td.appendChild(document.createTextNode(device.battery.source))
      }
      return td
    }
  }
, batteryStatus: {
    build: function(device) {
      var td = document.createElement('td')
      if (device.battery) {
        td.appendChild(document.createTextNode(device.battery.status))
      }
      return td
    }
  }
, batteryLevel: {
    build: function(device) {
      var td = document.createElement('td')
      if (device.battery) {
        td.appendChild(document.createTextNode(device.battery.level))
      }
      return td
    }
  }
, batteryTemp: {
    build: function(device) {
      var td = document.createElement('td')
      if (device.battery) {
        td.appendChild(document.createTextNode(device.battery.temp))
      }
      return td
    }
  }
, provider: {
    build: function() {
      var td = document.createElement('td')
      td.appendChild(document.createTextNode(''))
      return td
    }
  , update: function(td, device) {
      var t = td.firstChild
      t.nodeValue = device.provider.name
    }
  }
, owner: {
    build: function() {
      var td = document.createElement('td')
      td.appendChild(document.createTextNode(''))
      return td
    }
  , update: function(td, device) {
      var t = td.firstChild
      t.nodeValue = device.owner
        ? device.owner.name
        : ''
    }
  }
}

module.exports = function DeviceListDetailsDirective() {
  return {
    restrict: 'E'
  , template: require('./device-list-details.jade')
  , scope: {
      tracker: '&tracker'
    , columns: '&columns'
    }
  , link: function (scope, element) {
      var tracker = scope.tracker()
        , activeColumns = [
            'state'
          , 'model'
          , 'serial'
          , 'name'
          , 'operator'
          , 'releasedAt'
          , 'version'
          , 'network'
          , 'provider'
          , 'owner'
          ]
        , fixedSorting = [
            'state'
          ]
        , activeSorting = fixedSorting.concat([
            'name'
          , 'model'
          ])
        , table = element.find('table')[0]
        , tbody = table.createTBody()
        , rows = tbody.rows
        , prefix = 'd' + Math.floor(Math.random() * 1000000) + '-'
        , mapping = Object.create(null)

      table.className = 'table table-hover dataTable'
      element.append(table)

      function calculateId(device) {
        return prefix + device.serial
      }

      function compare(deviceA, deviceB) {
        var diff

        for (var i = 0, l = activeSorting.length; i < l; ++i) {
          diff = columns[activeSorting[i]].compare(deviceA, deviceB)
          if (diff !== 0) {
            break
          }
        }

        return diff
      }

      function createRow(device) {
        var id = calculateId(device)
          , tr = document.createElement('tr')
          , td

        tr.id = id

        for (var i = 0, l = activeColumns.length; i < l; ++i) {
          td = columns[activeColumns[i]].build()
          columns[activeColumns[i]].update(td, device)
          tr.appendChild(td)
        }

        mapping[id] = device

        return tr
      }

      function updateRow(tr, device) {
        var id = calculateId(device)

        tr.id = id

        for (var i = 0, l = activeColumns.length; i < l; ++i) {
          columns[activeColumns[i]].update(tr.cells[i], device)
        }

        return tr
      }

      function insertRow(tr, deviceA) {
        return insertRowToSegment(tr, deviceA, 0, rows.length - 1)
      }

      function insertRowToSegment(tr, deviceA, lo, hi) {
        var pivot = 0
          , deviceB
          , diff
          , after = true

        if (hi < 0) {
          tbody.appendChild(tr)
        }
        else {
          while (lo <= hi) {
            pivot = ~~((lo + hi) / 2)
            deviceB = mapping[rows[pivot].id]

            diff = compare(deviceA, deviceB)

            if (diff === 0) {
              after = true
              break
            }

            if (diff < 0) {
              hi = pivot - 1
              after = false
            }
            else {
              lo = pivot + 1
              after = true
            }
          }

          if (after) {
            tbody.insertBefore(tr, rows[pivot].nextSibling)
          }
          else {
            tbody.insertBefore(tr, rows[pivot])
          }
        }
      }

      function compareRow(tr, device) {
        var prev = tr.previousSibling
          , next = tr.nextSibling
          , diff

        if (prev) {
          diff = compare(device, mapping[prev.id])
          if (diff < 0) {
            return diff
          }
        }

        if (next) {
          diff = compare(device, mapping[next.id])
          if (diff > 0) {
            return diff
          }
        }

        return 0
      }

      function addListener(device) {
        insertRow(createRow(device), device)
      }

      function changeListener(device) {
        var id = calculateId(device)
          , tr = document.getElementById(id)
          , diff

        if (tr) {
          // First, update columns
          updateRow(tr, device)

          // Maybe the row is not sorted correctly anymore?
          diff = compareRow(tr, device)

          if (diff < 0) {
            // Should go higher in the list
            insertRowToSegment(tr, device, 0, tr.rowIndex - 1)
          }
          else if (diff > 0) {
            // Should go lower in the list
            insertRowToSegment(tr, device, tr.rowIndex + 1, rows.length)
          }
        }
      }

      function removeListener(device) {
        var id = calculateId(device)
          , tr = document.getElementById(id)

        if (tr) {
          tbody.removeChild(tr)
        }

        delete mapping[id]
      }

      tracker.on('add', addListener)
      tracker.on('change', changeListener)
      tracker.on('remove', removeListener)

      scope.$on('$destroy', function() {
        tracker.removeListener('add', addListener)
        tracker.removeListener('change', changeListener)
        tracker.removeListener('remove', removeListener)
      })
    }
  }
}
