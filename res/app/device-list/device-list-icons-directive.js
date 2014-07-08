module.exports = function DeviceListDetailsDirective(
  $filter
, DeviceColumnService
, GroupService
) {
  function DeviceItem() {
    return {
      build: function() {
        var li = document.createElement('li')
        li.className = 'cursor-select pointer thumbnail'

        // the whole li is a link
        var a = document.createElement('a')
        li.appendChild(a)

        // .device-photo-small
        var photo = document.createElement('div')
        photo.className = 'device-photo-small'
        var img = document.createElement('img')
        photo.appendChild(img)
        a.appendChild(photo)

        // .device-name
        var name = document.createElement('div')
        name.className = 'device-name'
        name.appendChild(document.createTextNode(''))
        a.appendChild(name)

        // button
        var button = document.createElement('button')
        button.appendChild(document.createTextNode(''))
        a.appendChild(button)

        return li
      }
    , update: function(li, device) {
        var a = li.firstChild
          , img = a.firstChild.firstChild
          , name = a.firstChild.nextSibling
          , nt = name.firstChild
          , button = name.nextSibling
          , at = button.firstChild
          , classes = 'btn btn-xs device-status '

        // .device-photo-small
        if (img.getAttribute('src') !== device.enhancedImage120) {
          img.setAttribute('src', device.enhancedImage120)
        }

        // .device-name
        nt.nodeValue = device.enhancedName

        // button
        at.nodeValue = $filter('translate')(device.enhancedStateAction)

        switch (device.state) {
        case 'using':
          button.className = classes + 'btn-primary'
          break
        case 'busy':
          button.className = classes + 'btn-warning'
          break
        case 'available':
        case 'ready':
        case 'present':
          button.className = classes + 'btn-primary-outline'
          break
        case 'preparing':
          button.className = classes + 'btn-primary-outline btn-success-outline'
          break
        case 'unauthorized':
          button.className = classes + 'btn-danger-outline'
          break
        case 'offline':
          button.className = classes + 'btn-warning-outline'
          break
        default:
          button.className = classes + 'btn-default-outline'
          break
        }

        if (device.usable) {
          a.href = '#!/control/' + device.serial
          li.classList.remove('device-is-busy')
        }
        else {
          a.removeAttribute('href')
          li.classList.add('device-is-busy')
        }

        return li
      }
    }
  }

  return {
    restrict: 'E'
  , template: require('./device-list-icons.jade')
  , scope: {
      tracker: '&tracker'
    , sort: '=sort'
    }
  , link: function (scope, element) {
      var tracker = scope.tracker()
        , activeSorting = []
        , list = element.find('ul')[0]
        , items = list.childNodes
        , prefix = 'd' + Math.floor(Math.random() * 1000000) + '-'
        , mapping = Object.create(null)
        , builder = DeviceItem()


      function kickDevice(device, force) {
        return GroupService.kick(device, force).catch(function (e) {
          console.log(e)
          alert($filter('translate')(gettext('Device cannot get kicked from the group')))
        })
      }

      element.on('click', function (e) {
        if (e.target.classList.contains('device-status')) {
          var id = e.target.parentNode.parentNode.id
          var device = mapping[id]

          if (device.using) {
            kickDevice(device)
            e.preventDefault()
          }
        }
      })

      // Import column definitions
      scope.columnDefinitions = DeviceColumnService

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

        var swap = {
          asc: 'desc'
        , desc: 'asc'
        }

        var fixedMatch = findInSorting(scope.sort.fixed)
        if (fixedMatch) {
          fixedMatch.order = swap[fixedMatch.order]
          return
        }

        var userMatch = findInSorting(scope.sort.user)
        if (userMatch) {
          userMatch.order = swap[userMatch.order]
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
          , order: scope.columnDefinitions[column.name].defaultOrder || 'asc'
          })
        }
      }

      // Watch for sorting changes
      scope.$watch(
        function() {
          return scope.sort
        }
      , function(newValue) {
          activeSorting = newValue.fixed.concat(newValue.user)
          scope.sortedColumns = Object.create(null)
          activeSorting.forEach(function(sort) {
            scope.sortedColumns[sort.name] = sort
          })
          sortAll()
        }
      , true
      )

      // Calculates a DOM ID for the device. Should be consistent for the
      // same device within the same table, but unique among other tables.
      function calculateId(device) {
        return prefix + device.serial
      }

      // Compares two devices using the currently active sorting. Returns <0
      // if deviceA is smaller, >0 if deviceA is bigger, or 0 if equal.
      var compare = (function() {
        var mapping = {
          asc: 1
        , desc: -1
        }
        return function(deviceA, deviceB) {
          var diff

          // Find the first difference
          for (var i = 0, l = activeSorting.length; i < l; ++i) {
            var sort = activeSorting[i]
            diff = scope.columnDefinitions[sort.name].compare(deviceA, deviceB)
            if (diff !== 0) {
              diff *= mapping[sort.order]
              break
            }
          }

          return diff
        }
      })()

      // Creates a completely new item for the device. Means that this is
      // the first time we see the device.
      function createItem(device) {
        var id = calculateId(device)
          , item = builder.build()

        item.id = id
        builder.update(item, device)
        mapping[id] = device

        return item
      }

      // Updates all the columns in the item. Note that the item must be in
      // the right format already (built with createItem() and patched with
      // patchItem() if necessary).
      function updateItem(item, device) {
        var id = calculateId(device)

        item.id = id
        builder.update(item, device)

        return item
      }

      // Inserts a item into the table into its correct position according to
      // current sorting.
      function insertItem(item, deviceA) {
        return insertItemToSegment(item, deviceA, 0, items.length - 1)
      }

      // Inserts a item into a segment of the table into its correct position
      // according to current sorting.
      function insertItemToSegment(item, deviceA, lo, hi) {
        var pivot = 0
          , deviceB

        if (hi < 0) {
          list.appendChild(item)
        }
        else {
          var after = true

          while (lo <= hi) {
            pivot = ~~((lo + hi) / 2)
            deviceB = mapping[items[pivot].id]

            var diff = compare(deviceA, deviceB)

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
            list.insertBefore(item, items[pivot].nextSibling)
          }
          else {
            list.insertBefore(item, items[pivot])
          }
        }
      }

      // Compares a item to its siblings to see if it's still in the correct
      // position. Returns <0 if the device should actually go somewhere
      // before the previous item, >0 if it should go somewhere after the next
      // item, or 0 if the position is already correct.
      function compareItem(item, device) {
        var prev = item.previousSibling
          , next = item.nextSibling
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

      // Sort all items.
      function sortAll() {
        // This could be improved by getting rid of the array copying. The
        // copy is made because items can't be sorted directly.
        var sorted = [].slice.call(items).sort(function(itemA, itemB) {
          return compare(mapping[itemA.id], mapping[itemB.id])
        })

        // Now, if we just append all the elements, they will be in the
        // correct order in the table.
        for (var i = 0, l = sorted.length; i < l; ++i) {
          list.appendChild(sorted[i])
        }
      }

      // Triggers when the tracker sees a device for the first time.
      function addListener(device) {
        insertItem(createItem(device), device)
      }

      // Triggers when the tracker notices that a device changed.
      function changeListener(device) {
        var id = calculateId(device)
          , item = list.children[id]

        if (item) {
          // First, update columns
          updateItem(item, device)

          // Maybe the item is not sorted correctly anymore?
          var diff = compareItem(item, device)
          if (diff !== 0) {
            // Because the item is no longer sorted correctly, we must
            // remove it so that it doesn't confuse the binary search.
            // Then we will simply add it back.
            list.removeChild(item)
            insertItem(item, device)
          }
        }
      }

      // Triggers when a device is removed entirely from the tracker.
      function removeListener(device) {
        var id = calculateId(device)
          , item = list.children[id]

        if (item) {
          list.removeChild(item)
        }

        delete mapping[id]
      }

      tracker.on('add', addListener)
      tracker.on('change', changeListener)
      tracker.on('remove', removeListener)

      // Maybe we're already late
      tracker.devices.forEach(addListener)

      scope.$on('$destroy', function() {
        tracker.removeListener('add', addListener)
        tracker.removeListener('change', changeListener)
        tracker.removeListener('remove', removeListener)
      })
    }
  }
}
