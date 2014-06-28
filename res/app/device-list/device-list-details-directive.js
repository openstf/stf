var directive = module.exports = function DeviceListDetailsDirective(
  $filter
, gettext
) {
  return {
    restrict: 'E'
  , template: require('./device-list-details.jade')
  , scope: {
      tracker: '&tracker'
    , columns: '&columns'
    , sort: '=sort'
    }
  , link: function (scope, element) {
      var tracker = scope.tracker()
        , activeColumns = []
        , activeSorting = []
        , table = element.find('table')[0]
        , tbody = table.createTBody()
        , rows = tbody.rows
        , prefix = 'd' + Math.floor(Math.random() * 1000000) + '-'
        , mapping = Object.create(null)

      // Builders for all possible values
      scope.columnDefinitions = {
        state: directive.DeviceStatusCell({
          title: gettext('Status')
        , value: function(device) {
            return $filter('translate')(device.enhancedStateAction)
          }
        })
      , model: directive.DeviceModelCell({
          title: gettext('Model')
        , value: function(device) {
            return device.model || device.serial
          }
        })
      , name: directive.TextCell({
          title: gettext('Product')
        , value: function(device) {
            return device.name || ''
          }
        })
      , operator: directive.TextCell({
          title: gettext('Carrier')
        , value: function(device) {
            return device.operator || ''
          }
        })
      , releasedAt: directive.DateCell({
          title: gettext('Released')
        , value: function(device) {
            return device.releasedAt ? new Date(device.releasedAt) : null
          }
        })
      , version: directive.TextCell({
          title: gettext('OS')
        , value: function(device) {
            return device.version || ''
          }
        })
      , network: directive.TextCell({
          title: gettext('Network')
        , value: function(device) {
            return device.phone ? device.phone.network : ''
          }
        })
      , display: directive.TextCell({
          title: gettext('Screen')
        , value: function(device) {
            return device.display
              ? device.display.width + 'x' + device.display.height
              : ''
          }
        })
      , serial: directive.TextCell({
          title: gettext('Serial')
        , value: function(device) {
            return device.serial || ''
          }
        })
      , manufacturer: directive.TextCell({
          title: gettext('Manufacturer')
        , value: function(device) {
            return device.manufacturer || ''
          }
        })
      , sdk: directive.TextCell({
          title: gettext('SDK')
        , value: function(device) {
            return device.sdk || ''
          }
        })
      , abi: directive.TextCell({
          title: gettext('ABI')
        , value: function(device) {
            return device.abi || ''
          }
        })
      , phone: directive.TextCell({
          title: gettext('Phone')
        , value: function(device) {
            return device.phone ? device.phone.phoneNumber : ''
          }
        })
      , imei: directive.TextCell({
          title: gettext('Phone IMEI')
        , value: function(device) {
            return device.phone ? device.phone.imei : ''
          }
        })
      , iccid: directive.TextCell({
          title: gettext('Phone ICCID')
        , value: function(device) {
            return device.phone ? device.phone.iccid : ''
          }
        })
      , batteryHealth: directive.TextCell({
          title: gettext('Battery Health')
        , value: function(device) {
            return device.battery ? device.battery.health : ''
          }
        })
      , batterySource: directive.TextCell({
          title: gettext('Battery Source')
        , value: function(device) {
            return device.battery ? device.battery.source : ''
          }
        })
      , batteryStatus: directive.TextCell({
          title: gettext('Battery Status')
        , value: function(device) {
            return device.battery ? device.battery.status : ''
          }
        })
      , batteryLevel: directive.TextCell({
          title: gettext('Battery Level')
        , value: function(device) {
            return device.battery
              ? Math.floor(device.battery.level / device.battery.scale * 100) + '%'
              : ''
          }
        })
      , batteryTemp: directive.TextCell({
          title: gettext('Battery Temperature')
        , value: function(device) {
            return device.battery ? device.battery.temp + '°C' : ''
          }
        })
      , provider: directive.TextCell({
          title: gettext('Location')
        , value: function(device) {
            return device.provider ? device.provider.name : ''
          }
        })
      , owner: directive.LinkCell({
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

      // Sorting
      scope.sortBy = function(column, multiple) {
        function findInSorting(sorting) {
          for (var i = 0, l = sorting.length; i < l; ++i) {
            if (sorting[i].name === column.name) {
              return sorting[i]
            }
          }
          return null
        }

        var fixedMatch = findInSorting(scope.sort.fixed)
        if (fixedMatch) {
          fixedMatch.order *= -1
          return
        }

        var userMatch = findInSorting(scope.sort.user)
        if (userMatch) {
          userMatch.order *= -1
          if (!multiple) {
            scope.sort.user = [userMatch]
          }
        }
        else {
          if (!multiple) {
            scope.sort.user = []
          }
          scope.sort.user.push({
            name: column.name
          , order: scope.columnDefinitions[column.name].defaultOrder || 1
          })
        }
      }

      // Watch for sorting changes
      scope.$watch(
        function() {
          return scope.sort
        }
      , function(newValue) {
          activeSorting = scope.sort.fixed.concat(scope.sort.user)
          sortAll()
        }
      , true
      )

      // Watch for column updates
      scope.$watch(
        function() {
          return scope.columns()
        }
      , function(newValue) {
          updateColumns(newValue)
        }
      , true
      )

      // Update now so that we don't have to wait for the scope watcher to
      // trigger.
      updateColumns(scope.columns())

      // Updates visible columns. This method doesn't necessarily have to be
      // the fastest because it shouldn't get called all the time.
      function updateColumns(columnSettings) {
        var newActiveColumns = []
          , newMapping = Object.create(null)
          , oldMapping = Object.create(null)
          , patch = []
          , i
          , l

        // First, check what we are supposed to have now
        for (i = 0, l = columnSettings.length; i < l; ++i) {
          var columnSetting = columnSettings[i]
          if (columnSetting.selected) {
            newActiveColumns.push(columnSetting.name)
            newMapping[columnSetting.name] = true
          }
        }

        // Check what we need to remove from the currently active columns
        var removeAdjust = 0
        for (i = 0, l = activeColumns.length; i < l; ++i) {
          var oldColumn = activeColumns[i]
          // Fix index so that they make sense when the operations are
          // run in order.
          oldMapping[oldColumn] = true
          if (!newMapping[oldColumn]) {
            patch.push({
              type: 'remove'
            , column: oldColumn
            , index: i - removeAdjust
            })
            removeAdjust += 1
          }
        }

        // Check what we need to add
        var insertAdjust = 0
        for (i = 0, l = newActiveColumns.length; i < l; ++i) {
          var newColumn = newActiveColumns[i]
          if (!oldMapping[newColumn]) {
            patch.push({
              type: 'insert'
            , column: newColumn
            , index: i + insertAdjust
            })
            insertAdjust += 1
          }
        }

        // @TODO move operations

        activeColumns = newActiveColumns

        return patchAll(patch)
      }

      // Calculates a DOM ID for the device. Should be consistent for the
      // same device within the same table, but unique among other tables.
      function calculateId(device) {
        return prefix + device.serial
      }

      // Compares two devices using the currently active sorting. Returns <0
      // if deviceA is smaller, >0 if deviceA is bigger, or 0 if equal.
      function compare(deviceA, deviceB) {
        var sort, diff

        // Find the first difference
        for (var i = 0, l = activeSorting.length; i < l; ++i) {
          sort = activeSorting[i]
          diff = scope.columnDefinitions[sort.name].compare(deviceA, deviceB) * sort.order
          if (diff !== 0) {
            break
          }
        }

        return diff
      }

      // Creates a completely new row for the device. Means that this is
      // the first time we see the device.
      function createRow(device) {
        var id = calculateId(device)
          , tr = document.createElement('tr')
          , td

        tr.id = id

        for (var i = 0, l = activeColumns.length; i < l; ++i) {
          td = scope.columnDefinitions[activeColumns[i]].build()
          scope.columnDefinitions[activeColumns[i]].update(td, device)
          tr.appendChild(td)
        }

        mapping[id] = device

        return tr
      }

      // Patches all rows.
      function patchAll(patch) {
        for (var i = 0, l = rows.length; i < l; ++i) {
          patchRow(rows[i], mapping[rows[i].id], patch)
        }
      }

      // Patches the given row by running the given patch operations in
      // order. The operations must take into account index changes caused
      // by previous operations.
      function patchRow(tr, device, patch) {
        for (var i = 0, l = patch.length; i < l; ++i) {
          var op = patch[i]
          switch (op.type) {
          case 'insert':
            var col = scope.columnDefinitions[op.column]
            tr.insertBefore(col.update(col.build(), device), tr.cells[op.index])
            break
          case 'remove':
            tr.deleteCell(op.index)
            break
          }
        }

        return tr
      }

      // Updates all the columns in the row. Note that the row must be in
      // the right format already (built with createRow() and patched with
      // patchRow() if necessary).
      function updateRow(tr, device) {
        var id = calculateId(device)

        tr.id = id

        for (var i = 0, l = activeColumns.length; i < l; ++i) {
          scope.columnDefinitions[activeColumns[i]].update(tr.cells[i], device)
        }

        return tr
      }

      // Inserts a row into the table into its correct position according to
      // current sorting.
      function insertRow(tr, deviceA) {
        return insertRowToSegment(tr, deviceA, 0, rows.length - 1)
      }

      // Inserts a row into a segment of the table into its correct position
      // according to current sorting.
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

      // Compares a row to its siblings to see if it's still in the correct
      // position. Returns <0 if the device should actually go somewhere
      // before the previous row, >0 if it should go somewhere after the next
      // row, or 0 if the position is already correct.
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

      // Sort all rows.
      function sortAll() {
        // This could be improved by getting rid of the array copying. The
        // copy is made because rows can't be sorted directly.
        var sorted = [].slice.call(rows).sort(function(rowA, rowB) {
          return compare(mapping[rowA.id], mapping[rowB.id])
        })

        // Now, if we just append all the elements, they will be in the
        // correct order in the table.
        for (var i = 0, l = sorted.length; i < l; ++i) {
          tbody.appendChild(sorted[i])
        }
      }

      // Triggers when the tracker sees a device for the first time.
      function addListener(device) {
        insertRow(createRow(device), device)
      }

      // Triggers when the tracker notices that a device changed.
      function changeListener(device) {
        var id = calculateId(device)
          , tr = rows[id]
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

      // Triggers when a device is removed entirely from the tracker.
      function removeListener(device) {
        var id = calculateId(device)
          , tr = rows[id]

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

function zeroPadTwoDigit(digit) {
  return digit < 10 ? '0' + digit : '' + digit
}

function compareIgnoreCase(a, b) {
  var la = (a || '').toLowerCase()
    , lb = (b || '').toLowerCase()
  return la === lb ? 0 : (la < lb ? -1 : 1)
}

function compareRespectCase(a, b) {
  return a === b ? 0 : (a < b ? -1 : 1)
}

module.exports.TextCell = function TextCell(options) {
  return {
    title: options.title
  , defaultOrder: 1
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
  }
}

module.exports.DateCell = function DateCell(options) {
  return {
    title: options.title
  , defaultOrder: -1
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
  }
}

module.exports.LinkCell = function LinkCell(options) {
  return {
    title: options.title
  , defaultOrder: 1
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
  }
}

module.exports.DeviceModelCell = function DeviceModelCell(options) {
  return {
    title: options.title
  , defaultOrder: 1
  , build: function() {
      var td = document.createElement('td')
        , span = document.createElement('span')
        , image = document.createElement('img')
      span.className = 'device-small-image'
      span.appendChild(image)
      td.appendChild(span)
      td.appendChild(document.createTextNode(''))
      return td
    }
  , update: function(td, device) {
      var span = td.firstChild
        , image = span.firstChild
        , t = span.nextSibling
        , src = '/static/devices/icon/x24/' + (device.image || '_default.jpg')
      // Only change if necessary so that we don't trigger a download
      if (image.getAttribute('src') !== src) {
        image.setAttribute('src', src)
      }
      t.nodeValue = options.value(device)
      return td
    }
  , compare: function(a, b) {
      return compareRespectCase(options.value(a), options.value(b))
    }
  }
}

module.exports.DeviceStatusCell = function DeviceStatusCell(options) {
  return {
    title: options.title
  , defaultOrder: 1
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
      if (device.usable) {
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
  }
}
