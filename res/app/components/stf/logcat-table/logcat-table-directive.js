var _ = require('lodash')

module.exports = function logcatTableDirective($rootScope, $timeout, logcatAutoScroll) {
  return {
    restrict: 'E',
    replace: true,
    template: require('./logcat-table.jade'),
    link: function (scope, element, attrs) {
      var parent = element[0]
      var body = element.find('tbody')[0]

      function scrollToBottom() {
        parent.scrollTop = parent.scrollHeight + 20
        $timeout(function () {
          parent.scrollTop = parent.scrollHeight
        }, 10)
      }

      function addRow(data, batchRequest) {
        var newRow = body.insertRow(-1)

//        newRow.insertCell(-1)
//          .appendChild($document.createTextNode(DeviceLogService.linesCounter));
//        newRow.insertCell(-1)
//          .appendChild($document.createTextNode(data.deviceName));
//        newRow.insertCell(-1)
//          .appendChild($document.createTextNode(data.levelName));
//        newRow.insertCell(-1)
//          .appendChild($document.createTextNode(data.dateFormatted));
//        if ($rootScope.platform === 'native') {
        newRow.insertCell(-1)
          .appendChild(document.createTextNode(data.pid))
        newRow.insertCell(-1)
          .appendChild(document.createTextNode(data.tid))
        newRow.insertCell(-1)
          .appendChild(document.createTextNode(data.app))
        newRow.insertCell(-1)
          .appendChild(document.createTextNode(data.tag))
//        }
        newRow.insertCell(-1)
          .appendChild(document.createTextNode(data.message))

        if (logcatAutoScroll && !batchRequest) {
          _.throttle(scrollToBottom, 10)()
        }
      }

      function clearTable() {
        var oldBody = body
        var newBody = document.createElement('tbody')
        oldBody.parentNode.replaceChild(newBody, oldBody)
        body = newBody
      }

      addRow({
        "serial": "1cd49783",
        "date": 1399964036.984,
        "pid": 9246,
        "tid": 9540,
        "priority": 3,
        "tag": "MobileDataStateTracker",
        "message": "default: setPolicyDataEnable(enabled=true)"
      })

      for (var i = 0; i < 50; i++) {
        addRow({
          "serial": "14141cd49783",
          "date": 1399964036.984,
          "pid": 9246,
          "tid": 9540,
          "priority": 3,
          "tag": "MobileDataStateTracker",
          "message": "XXdefault: setPolicyDataEnable(enabled=true)"
        })
      }

      $timeout(function () {
        for (var i = 0; i < 10; i++) {
          addRow({
            "serial": "14141cd49783",
            "date": 1399964036.984,
            "pid": 9246,
            "tid": 9540,
            "priority": 3,
            "tag": "MobileDataStateTracker",
            "message": "XXdefault: setPolicyDataEnable(enabled=true)"
          })
        }
      }, 1000)


    }
  }
}
