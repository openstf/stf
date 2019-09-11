var _ = require('lodash')

module.exports =
  function logcatTableDirective($rootScope, $timeout, LogcatService, SaveLogService) {
    return {
      restrict: 'E',
      replace: true,
      template: require('./logcat-table.pug'),
      link: function(scope, element) {
        var autoScroll = true
        var autoScrollDependingOnScrollPosition = true
        var scrollPosition = 0
        var scrollHeight = 0
        var parent = element[0]
        var body = element.find('tbody')[0]
        var maxEntriesBuffer = 3000
        var maxVisibleEntries = 100
        var deviceSerial = (window.location.href).split('/').pop()

        scope.started = checkLoggerServiceStatus(true)
        scope.allowClean = checkAllowClean()

        function checkAllowClean() {
          if (Object.keys(LogcatService.deviceEntries).includes(deviceSerial)) {
            return LogcatService.deviceEntries[deviceSerial].allowClean
          }

          return false
        }

        function checkLoggerServiceStatus(loadLogs = false) {
          var collectedLogs = []
          var isStarted = false
          if (Object.keys($rootScope).includes('LogcatService')) {
            LogcatService.deviceEntries = $rootScope.LogcatService.deviceEntries
          }

          if (Object.keys(LogcatService.deviceEntries).includes(deviceSerial)) {
            collectedLogs = LogcatService.deviceEntries[deviceSerial].logs
            isStarted = LogcatService.deviceEntries[deviceSerial].started
          }

          if (loadLogs) {
            restoreLogs(collectedLogs)
          }
          return isStarted
        }

        function limitVisibleEntries() {
          var limiter = ''
          if (maxVisibleEntries > maxEntriesBuffer) {
            limiter = maxEntriesBuffer
          } else {
            limiter = maxVisibleEntries
          }

          if (element.find('tbody')[0].rows.length > limiter) {
            removeFirstLogTableEntry()
          }
        }

        function removeFirstLogTableEntry() {
          element.find('tbody')[0].deleteRow(0)
        }

        LogcatService.addEntryListener = function(entry) {
          if (deviceSerial === entry.serial) {
            limitVisibleEntries()
            if (LogcatService.deviceEntries[deviceSerial].logs.length > maxEntriesBuffer) {
              LogcatService.deviceEntries[deviceSerial].logs.shift()
            }
            addRow(body, entry)
          }
        }

        LogcatService.addFilteredEntriesListener = function(entries) {
          checkLoggerServiceStatus()
        }

        function shouldAutoScroll() {
          if (autoScrollDependingOnScrollPosition) {
            return scrollPosition === scrollHeight
          } else {
            return true
          }
        }

        function scrollListener(event) {
          scrollPosition = event.target.scrollTop + event.target.clientHeight
          scrollHeight = event.target.scrollHeight
        }

        var throttledScrollListener = _.throttle(scrollListener, 100)
        parent.addEventListener('scroll', throttledScrollListener, false)

        function scrollToBottom() {
          parent.scrollTop = parent.scrollHeight + 20
          $timeout(function() {
            parent.scrollTop = parent.scrollHeight
          }, 10)
        }

        function addRow(rowParent, data, batchRequest) {
          var newRow = rowParent.insertRow(-1)

          newRow.classList.add('log-' + data.priorityLabel)
          newRow.insertCell(-1)
            .appendChild(document.createTextNode(data.priorityLabel))
          newRow.insertCell(-1)
            .appendChild(document.createTextNode(data.dateLabel))
          if ($rootScope.platform === 'native') {
            newRow.insertCell(-1)
              .appendChild(document.createTextNode(data.pid))
            newRow.insertCell(-1)
              .appendChild(document.createTextNode(data.tid))
            newRow.insertCell(-1)
              .appendChild(document.createTextNode(data.tag))
          }
          newRow.insertCell(-1)
            .appendChild(document.createTextNode(data.message))

          if (autoScroll && shouldAutoScroll() && !batchRequest) {
            _.throttle(scrollToBottom, 30)()
          }
        }

        function clearTable() {
          var oldBody = body
          var newBody = document.createElement('tbody')
          oldBody.parentNode.replaceChild(newBody, oldBody)
          body = newBody
        }

        scope.clearTable = function() {
          LogcatService.clear()
          clearTable()
        }

        function restoreLogs(collectedLogs) {
          clearTable()

          var startFrom = 0
          if (collectedLogs.length - maxVisibleEntries >= 0) {
            startFrom = collectedLogs.length - maxVisibleEntries
          }

          for (var logLine = startFrom; logLine < collectedLogs.length; logLine++) {
            if (deviceSerial === collectedLogs[logLine].serial) {
              addRow(body, collectedLogs[logLine], true)
            }
          }
        }

        /**
           * Validate filter.data object value and assign bordercolor to red if value
           * doesn't match regex(pattern):
           * - HH:mm:ss.SSS
           * - H:mm:ss.SSS
           * - :mm:SS.SSS
           * - mm:ss.SSS
           * - m:ss.SSS
           * -... combinations
           *  in other case colour will be set to default.
           *
           * @param {event} event object
           * @returns {None} NaN
           */
        scope.validateDate = function(e) {
          var pattern = ['^(?:(?:([0-1]?\\d|2[0-3]):)?(:[0-5]\\d|[0-5]\\d):|\\d)',
            '?(:[0-5]\\d|[0-5]\\d{1,2})?(\\.[0-9]?\\d{0,2}|:[0-5]?\\d{0,1})|(\\d{0,2})'].join([])
          var regex = new RegExp(pattern, 'g')
          var inputValue = event.srcElement.value
          var matchArray = inputValue.match(regex)
          var isTextValid = false
          if (matchArray) {
            matchArray.forEach(function(item, index) {
              if (item === inputValue) {
                isTextValid = true
                event.srcElement.style.borderColor = ''
              }
            })
          }

          if (isTextValid === false) {
            event.srcElement.style.borderColor = 'red'
          }
        }

        /**
         * Show "Save Log" modal.
         *
         * @returns {None} NaN
         */
        scope.saveLogs = function() {
          var collectedLogs = []

          if (Object.keys(LogcatService.deviceEntries).includes(deviceSerial)) {
            collectedLogs = LogcatService.deviceEntries[deviceSerial].logs
          }

          SaveLogService.open(collectedLogs, false)
        }

        scope.$on('$destroy', function() {
          parent.removeEventListener('scroll', throttledScrollListener)
        })
      }
    }
  }
