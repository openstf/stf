var _ = require('lodash')
var _s = require('underscore.string')

module.exports = function LogcatServiceFactory(socket, DeviceService) {
  var service = {}

  service.started = false

  service.maxBuffer = 5000

  service.numberOfEntries = 0

  service.filters = {
    numberOfEntries: 0,
    entries: [
      {
        "serial": "1cd49783",
        "date": 1399964036.984,
        "pid": 9246,
        "tid": 9540,
        "priority": 3,
        "tag": "MobileDataStateTracker",
        "message": "default:(enabled=true)"
      }
    ],
    levelNumber: null,
    levelNumbers: []
  }


  service.entries = [
    {
      "serial": "1cd49783",
      "date": 1399964036.984,
      "pid": 9246,
      "tid": 9540,
      "priority": 3,
      "tag": "MobileDataStateTracker",
      "message": "default:(enabled=true)"
    },
    {
      "serial": "1dcvafaasfafcd49783",
      "date": 1399964036.984,
      "pid": 9246,
      "tid": 9540,
      "priority": 2,
      "tag": "MobileDataStateTracker",
      "message": "default: setPolicyDataEnable(enabled=true)"
    }

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
    data.dateLabel = _s.pad(date.getHours(), 2, '0') + ':' +
      _s.pad(date.getMinutes(), 2, '0') + ':' +
      _s.pad(date.getSeconds(), 2, '0') + '.' +
      _s.pad(date.getMilliseconds(), 3, '0')

    data.deviceLabel = 'Android'

    data.priorityLabel = logLevelsCapitalized[data.priority]

    return data
  }

  socket.on('logcat.entry', function (data) {
    service.numberOfEntries++

//    console.log(enhanceEntry(data))
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

