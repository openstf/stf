/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

const _ = require('lodash')

module.exports = function CommonServiceFactory(
  $window,
  $location,
  GenericModalService
) {
  const service = {}

  const FIVE_MN = 300 * 1000
  const ONE_HOUR = 3600 * 1000
  const ONE_DAY = 24 * ONE_HOUR
  const ONE_WEEK = 7 * ONE_DAY
  const ONE_MONTH = 30 * ONE_DAY
  const ONE_QUATER = 3 * ONE_MONTH
  const ONE_HALF_YEAR = 6 * ONE_MONTH
  const ONE_YEAR = 365 * ONE_DAY

  function getClassOptionsField(id, field) {
    for(var i in service.classOptions) {
      if (service.classOptions[i].id === id) {
        return service.classOptions[i][field]
      }
    }
    return ''
  }

  service.classOptions = [
    {name: 'Once', id: 'once', privilege: 'user', duration: Infinity},
    {name: 'Hourly', id: 'hourly', privilege: 'user', duration: ONE_HOUR},
    {name: 'Daily', id: 'daily', privilege: 'user', duration: ONE_DAY},
    {name: 'Weekly', id: 'weekly', privilege: 'user', duration: ONE_WEEK},
    {name: 'Monthly', id: 'monthly', privilege: 'user', duration: ONE_MONTH},
    {name: 'Quaterly', id: 'quaterly', privilege: 'user', duration: ONE_QUATER},
    {name: 'Halfyearly', id: 'halfyearly', privilege: 'user', duration: ONE_HALF_YEAR},
    {name: 'Yearly', id: 'yearly', privilege: 'user', duration: ONE_YEAR},
    {name: 'Debug', id: 'debug', privilege: 'admin', duration: FIVE_MN},
    {name: 'Bookable', id: 'bookable', privilege: 'admin', duration: Infinity},
    {name: 'Standard', id: 'standard', privilege: 'admin', duration: Infinity}
  ]

  service.getClassName = function(id) {
    return getClassOptionsField(id, 'name')
  }

  service.getClassDuration = function(id) {
    return getClassOptionsField(id, 'duration')
  }

  service.getDuration = function(ms) {
    if (ms < 1000) {
      return '0s'
    }
    var s = Math.floor(ms / 1000)
    var m = Math.floor(s / 60)

    s %= 60
    var h = Math.floor(m / 60)

    m %= 60
    var d = Math.floor(h / 24)

    h %= 24
    return (d === 0 ? '' : d + 'd') +
           (h === 0 ? '' : (d === 0 ? '' : ' ') + h + 'h') +
           (m === 0 ? '' : (h === 0 ? '' : ' ') + m + 'm') +
           (s === 0 ? '' : (m === 0 ? '' : ' ') + s + 's')
  }

  service.errorWrapper = function(fn, args) {
    return fn.apply(null, args).catch(function(error) {
      return GenericModalService.open({
        message: error.data ?
                   error.data.description :
                   error.status + ' ' + error.statusText
      , type: 'Error'
      , size: 'lg'
      , cancel: false
      })
      .then(function() {
        return error
      })
    })
  }

  service.getIndex = function(array, value, property) {
    for(var i in array) {
      if (array[i][property] === value) {
        return i
      }
    }
    return -1
  }

  service.merge = function(oldObject, newObject) {
    var undefinedValue

    return _.merge(oldObject, newObject, function(a, b) {
      return _.isArray(b) ? b : undefinedValue
    })
  }

  service.isAddable = function(object, timeStamp) {
    return typeof object === 'undefined' ||
           timeStamp >= object.timeStamp && object.index === -1
  }

  service.isExisting = function(object) {
    return typeof object !== 'undefined' &&
           object.index !== -1
  }

  service.isRemovable = function(object, timeStamp) {
    return service.isExisting(object) &&
           timeStamp >= object.timeStamp
  }

  service.add = function(array, objects, value, property, timeStamp) {
    if (service.isAddable(objects[value[property]], timeStamp)) {
      objects[value[property]] = {
        index: array.push(value) - 1
      , timeStamp: timeStamp
      }
      return array[objects[value[property]].index]
    }
    return null
  }

  service.update = function(array, objects, value, property, timeStamp, noAdding) {
    if (service.isExisting(objects[value[property]])) {
      service.merge(array[objects[value[property]].index], value)
      objects[value[property]].timeStamp = timeStamp
      return array[objects[value[property]].index]
    }
    else if (!noAdding) {
      return service.add(array, objects, value, property, timeStamp)
    }
    return null
  }

  service.delete = function(array, objects, key, timeStamp) {
    if (service.isRemovable(objects[key], timeStamp)) {
      const index = objects[key].index
      const value = array.splice(index, 1)[0]

      objects[key].index = -1
      objects[key].timeStamp = timeStamp
      for (var k in objects) {
        if (objects[k].index > index) {
          objects[k].index--
        }
      }
      return value
    }
    else if (typeof objects[key] === 'undefined') {
      objects[key] = {
        index: -1
      , timeStamp: timeStamp
      }
    }
    return null
  }

  service.sortBy = function(data, column) {
    const index = service.getIndex(data.columns, column.name, 'name')

    if (index !== data.sort.index) {
      data.sort.reverse = false
      column.sort = 'sort-asc'
      data.columns[data.sort.index].sort = 'none'
      data.sort.index = index
    }
    else {
      data.sort.reverse = !data.sort.reverse
      column.sort = column.sort === 'sort-asc' ? 'sort-desc' : 'sort-asc'
    }
    return service
  }

  service.isOriginGroup = function(_class) {
    return _class === 'bookable' || _class === 'standard'
  }

  service.isNoRepetitionsGroup = function(_class) {
    return service.isOriginGroup(_class) || _class === 'once'
  }

  service.url = function(url) {
    const a = $window.document.createElement('a')

    $window.document.body.appendChild(a)
    a.href = url
    a.click()
    $window.document.body.removeChild(a)
    return service
  }

  service.copyToClipboard = function(data) {
    const input = $window.document.createElement('input')

    $window.document.body.appendChild(input)
    input.value = data
    input.select()
    $window.document.execCommand('copy')
    $window.document.body.removeChild(input)
    return service
  }

  service.getBaseUrl = function() {
    return $location.protocol()
    + '://'
    + $location.host()
    + ':'
    + $location.port()
  }

  return service
}

