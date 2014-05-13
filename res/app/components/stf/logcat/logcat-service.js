var _ = require('lodash')

module.exports = function LogcatServiceFactory(socket) {
  var LogcatService = {}

  LogcatService.entries = []

  LogcatService.logLevels = [
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

  var logLevelsLowerCase = _.map(LogcatService.logLevels, function (level) {
    return level.toLowerCase()
  })

  var logLevelsCapitalized = _.map(logLevelsLowerCase, function (level) {
    //return _.capitalize(level)
  })

  function enhanceEntry(data) {
    var date = new Date(data.date)
//    data.dateFormatted = _.pad(date.getHours(), 2, '0') + ':' +
//      _.pad(date.getMinutes(), 2, '0') + ':' +
//      _.pad(date.getSeconds(), 2, '0') + '.' +
//      _.pad(date.getMilliseconds(), 3, '0')

    return data
  }

  socket.on('logcat.entry', function (data) {
    LogcatService.entries.push(enhanceEntry(data))
  })

  LogcatService.clear = function () {
    LogcatService.entries = []
  }

  return LogcatService
}

