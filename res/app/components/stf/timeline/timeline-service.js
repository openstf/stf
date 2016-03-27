module.exports = function TimelineServiceFactory() {
  var TimelineService = {}

  TimelineService.lines = []

  function addLine(line, type) {
    TimelineService.lines.push({
      type: type,
      title: line.title,
      message: line.message,
      serial: angular.copy(line.serial),
      time: Date.now()
    })
  }

  TimelineService.info = function(line) {
    addLine(line, 'info')
  }

  TimelineService.warn = function(line) {
    addLine(line, 'warn')
  }

  TimelineService.success = function(line) {
    addLine(line, 'success')
  }

  TimelineService.error = function(line) {
    addLine(line, 'error')
  }

  TimelineService.fatal = function(line) {
    addLine(line, 'fatal')
  }

  TimelineService.clear = function() {
    TimelineService.lines = []
  }

  return TimelineService
}
