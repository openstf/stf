var _ = require('lodash')

module.exports =
  function logcatTableDirective($rootScope, $timeout, LogcatService) {
    return {
      restrict: 'E',
      replace: true,
      template: require('./logcat-table.jade'),
      link: function(scope, element) {
        var autoScroll = true
        var autoScrollDependingOnScrollPosition = true
        var scrollPosition = 0
        var scrollHeight = 0
        var parent = element[0]
        var body = element.find('tbody')[0]
        var maxEntriesBuffer = 3000
        var numberOfEntries = 0

        function incrementNumberEntry() {
          numberOfEntries++
          if (numberOfEntries > maxEntriesBuffer) {
            scope.clearTable()
          }
        }

        LogcatService.addEntryListener = function(entry) {
          incrementNumberEntry()
          addRow(body, entry)
        }

        LogcatService.addFilteredEntriesListener = function(entries) {
          clearTable()
          //var fragment = document.createDocumentFragment()
          _.each(entries, function(entry) {
            // TODO: This is not adding all the entries after first scope creation
            incrementNumberEntry()
            addRow(body, entry, true)
          })
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

          //newRow.insertCell(-1)
          //  .appendChild(document.createTextNode(LogcatService.numberOfEntries))
          //newRow.insertCell(-1)
          //  .appendChild(document.createTextNode(data.deviceLabel))
          newRow.insertCell(-1)
            .appendChild(document.createTextNode(data.priorityLabel))
          newRow.insertCell(-1)
            .appendChild(document.createTextNode(data.dateLabel))
          if ($rootScope.platform === 'native') {
            newRow.insertCell(-1)
              .appendChild(document.createTextNode(data.pid))
            newRow.insertCell(-1)
              .appendChild(document.createTextNode(data.tid))
            //newRow.insertCell(-1)
            //  .appendChild(document.createTextNode(data.app))
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
          numberOfEntries = 0
          clearTable()
        }

        scope.$on('$destroy', function() {
          parent.removeEventListener('scroll', throttledScrollListener)
        })
      }
    }
  }
