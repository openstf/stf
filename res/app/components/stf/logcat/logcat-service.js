var _ = require('lodash')
var _s = require('underscore.string')

module.exports = function LogcatServiceFactory(socket, FilterStringService) {
  var service = {}
  service.started = false
  service.numberOfEntries = 0

  service.serverFilters = [
    {
      tag: '',
      priority: 2
    }
  ]

  service.filters = {
    numberOfEntries: 0,
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

  service.entries = [
  ]

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

  socket.on('logcat.entry', function(rawData) {
    service.numberOfEntries++
    service.entries.push(enhanceEntry(rawData))

    if (typeof (service.addEntryListener) === 'function') {
      if (filterLine(rawData)) {
        service.addEntryListener(rawData)
      }
    }
  })

  service.clear = function() {
    service.numberOfEntries = 0
    service.entries = []
  }

  service.filters.filterLines = function() {
    service.filters.entries = _.filter(service.entries, filterLine)

    if (typeof (service.addFilteredEntriesListener) === 'function') {
      service.addFilteredEntriesListener(service.filters.entries)
    }
  }

  function filterLine(line) {
    var enabled = true
    var filters = service.filters

    var matched = true
    if (enabled) {
      if (!_.isEmpty(filters.priority)) {
        matched &= line.priority >= filters.priority.number
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
    } else {
      matched = true
    }
    return matched
  }


  return service
}
