var _ = require('lodash')
var _s = require('underscore.string')

module.exports = function LogcatServiceFactory(socket, FilterStringService) {
  var service = {}
  service.started = false

  service.serverFilters = [
    {
      tag: '',
      priority: 2
    }
  ]

  service.filters = {
    entries: [
    ],
    levelNumbers: []
  }

  var _filters = {}

  function defineFilterProperties(properties) {
    _.forEach(properties, function(prop) {
      Object.defineProperty(service.filters, prop, {
        get: function() {
          return _filters[prop]
        },
        set: function(value) {
          _filters[prop] = value || null
          service.serverFilters[0][prop] = value || undefined
          service.filters.filterLines()
        }
      })
    })
  }

  defineFilterProperties([
    'levelNumber',
    'message',
    'pid',
    'tid',
    'dateLabel',
    'date',
    'tag',
    'priority'
  ])

  service.deviceSerial = []

  service.deviceEntries = {}

  service.logLevels = [
    'UNKNOWN',
    'DEFAULT',
    'VERBOSE',
    'DEBUG',
    'INFO',
    'WARN',
    'ERROR',
    'FATAL',
    'SILENT'
  ]

  var logLevelsLowerCase = _.map(service.logLevels, function(level) {
    return level.toLowerCase()
  })

  var logLevelsCapitalized = _.map(logLevelsLowerCase, function(level) {
    return _s.capitalize(level)
  })

  for (var i = 2; i < 8; ++i) {
    service.filters.levelNumbers.push({number: i, name: logLevelsCapitalized[i]})
  }

  function enhanceEntry(data) {
    var date = new Date(data.date * 1000)
    data.dateLabel =
      _s.pad(date.getHours(), 2, '0') + ':' +
      _s.pad(date.getMinutes(), 2, '0') + ':' +
      _s.pad(date.getSeconds(), 2, '0') + '.' +
      _s.pad(date.getMilliseconds(), 3, '0')

    data.deviceLabel = 'Android'

    data.priorityLabel = logLevelsCapitalized[data.priority]

    return data
  }

  function deviceSerialExist(serial) {
    if (service.deviceSerial !== serial) {
      service.deviceSerial.push(serial)
    }
  }

  service.initDeviceLogCollector = function(serial) {
    service.deviceEntries[serial] = {
      logs: [], selectedLogLevel: 2, started: false, allowClean: false, filters: {
        'levelNumber': service.filters.levelNumbers,
        'message': '',
        'pid': '',
        'tid': '',
        'dateLabel': '',
        'date': '',
        'tag': ''
        }
    }
  }

  socket.on('logcat.entry', function(rawData) {
    deviceSerialExist(rawData.serial)
    var TmpObject = enhanceEntry(rawData)
    if (!Object.keys(service.deviceEntries).includes(rawData.serial)) {
      service.deviceEntries[rawData.serial] = {logs: [], selectedLogLevel: 2, started: true}
    }

    service.deviceEntries[rawData.serial].logs.push(enhanceEntry(TmpObject))

    if (typeof (service.addEntryListener) === 'function') {
      if (filterLine(rawData)) {
        rawData.logsSerial = service.deviceSerial
        service.addEntryListener(rawData)
      }
    }
  })

  service.clear = function() {
    var devSerial = (window.location.href).split('/').pop()
    if (Object.keys(service.deviceEntries).includes(devSerial)) {
      service.deviceEntries[devSerial].logs = []
    }
  }

  service.filters.filterLines = function() {
    var devSerial = (window.location.href).split('/').pop()

    if (Object.keys(service.deviceEntries).includes(devSerial)) {
      service.filters.entries = _.filter(service.deviceEntries[devSerial].logs.entries, filterLine)
    }

    if (typeof (service.addFilteredEntriesListener) === 'function') {
      service.addFilteredEntriesListener(service.filters.entries)
    }
  }

  function filterLine(line) {
    var matched = true
    var devSerial = line.serial
    var filters = service.deviceEntries[devSerial].filters

    if (typeof filters !== 'undefined') {

      if (!_.isEmpty(filters.priority.toString())) {
        matched &= line.priority >= filters.priority
      }
      if (!_.isEmpty(filters.date)) {
        matched &= FilterStringService.filterString(filters.date, line.dateLabel)
      }
      if (!_.isEmpty(filters.pid)) {
        matched &= FilterStringService.filterInteger(filters.pid, line.pid)
      }
      if (!_.isEmpty(filters.tid)) {
        matched &= FilterStringService.filterInteger(filters.tid, line.tid)
      }
      if (!_.isEmpty(filters.tag)) {
        matched &= FilterStringService.filterString(filters.tag, line.tag)
      }
      if (!_.isEmpty(filters.message)) {
        matched &= FilterStringService.filterString(filters.message, line.message)
      }
    }
    return matched
  }

  return service
}
