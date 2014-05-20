var _ = require('lodash')
var _s = require('underscore.string')

module.exports = function LogcatServiceFactory(socket, DeviceService) {
  var service = {}
  service.started = false
  service.maxEntriesBuffer = 5000
  service.numberOfEntries = 0

  service.filters = {
    numberOfEntries: 0,
    entries: [
    ],
    levelNumber: null,
    levelNumbers: []
  }

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

  var logLevelsLowerCase = _.map(service.logLevels, function (level) {
    return level.toLowerCase()
  })

  var logLevelsCapitalized = _.map(logLevelsLowerCase, function (level) {
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

  socket.on('logcat.entry', function (data) {
    service.numberOfEntries++

    service.entries.push(enhanceEntry(data))

    if (true) {
      service.addEntryListener(data)
    }
  })

  service.clear = function () {
    service.numberOfEntries = 0
    service.entries = []
  }

  return service
}
