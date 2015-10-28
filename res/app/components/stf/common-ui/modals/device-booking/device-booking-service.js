require('./device-booking.less')
var _ = require('lodash')

module.exports =
  function DeviceBookingServiceFactory($modal, $location, $window, $filter,
                                       gettext, DeviceScheduleService, UserService) {
    var service = {}
    var curUser = UserService.currentUser
    var translate = $filter('translate')
    var MY_BOOK = translate(gettext('Reserved'))
    var OTHERS = translate(gettext('Other'))
    var ONEHOURE = 60 * 60 * 1000

    var ModalInstanceCtrl = function ($scope, $modalInstance, device) {
      $scope.device = device
      $scope.events = []
      $scope.targetDate = new Date()
      $scope.newrecord = null
      $scope.selected = null
      $scope.datepicker = {
        minDate: new Date()
        , opened: false
      }

      // modal controll
      $scope.ok = function () {
        $modalInstance.close(true)
      }

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel')
      }

      // schedule booking

      $scope.eventEdited = function (event, newStart, newEnd) {
        $scope.selected = null

        var newEvent = {
          id: event.schedule.id
        , serial: event.schedule.serial
        , start: newStart
        , end: newEnd
        }
        if (validate(newEvent)) {
          DeviceScheduleService.update(newEvent)

          event.startsAt = newStart
          event.endsAt = newEnd
          event.deletable = false
          event.draggable = false
          event.resizable = false
          event.type = 'important'
        }
      }

      $scope.deleteEvent = function () {
        var target = $scope.selected
        $scope.selected = null
        _.remove($scope.events, function(event) {
          return event.schedule.id === target.schedule.id
        })
        DeviceScheduleService.remove({
          id: target.schedule.id
        , serial: target.schedule.serial
        })
      }

      $scope.addRecord = function (startDate) {
        var endTime = startDate.getTime() + 30 * 60 * 1000
        var endDate = new Date(endTime)
        var newSchedule = {
          id: null,
          serial: device.serial,
          start: startDate,
          end: endDate,
        }
        if (validate(newSchedule)) {
          var newEvent = {
            schedule: newSchedule,
            title: 'new',
            type: 'important',
            startsAt: startDate,
            endsAt: endDate,
            deletable: false,
            draggable: false,
            resizable: false
          }
          $scope.events.push(newEvent)
          DeviceScheduleService.add(newSchedule)
        }
      }

      $scope.eventClick = function (clickedEvent) {
        if (clickedEvent) {
          $scope.selected = clickedEvent
        }
      }

      // date control
      $scope.$watch('targetDate', function() {
        $scope.selected = null
        loadEvents()
      })

      // utility
      function loadEvents() {
        DeviceScheduleService.load(device.serial, $scope.targetDate)
          .then(function(schedules) {
            $scope.events = []
            _.forEach(schedules, function(schedule){
              var own = curUser.email == schedule.email;
              $scope.events.push({
                schedule: schedule,
                title: (own? MY_BOOK : OTHERS) + '&nbsp;&#128270;',
                type: own? 'success': 'warning',
                startsAt: new Date(schedule.start),
                endsAt: new Date(schedule.end),
                deletable: own,
                draggable: own,
                resizable: own,
                cssClass: 'a-css-class-name',
                own: own
              })
            })
          })
      }

      function validate(newSchedule) {
        var diff = newSchedule.start.getTime() - Date.now()
        if (diff < ONEHOURE) {
          return false
        }
        var result = true
        _.forEach($scope.events, function(event) {
          var schedule = event.schedule
          if (newSchedule.id !== schedule.id &&
              newSchedule.start.getTime() < new Date(schedule.end).getTime() &&
              new Date(schedule.start).getTime() < newSchedule.end.getTime()) {
            result = false
            return false
          }
        })
        return result
      }

      $scope.$on('deviceSchedule.updated', function (event, message) {
        if (message.data.serial === device.serial) {
          loadEvents()
        }
      })

      // initialize
      loadEvents()
    }

    service.open = function (device) {
      var modalInstance = $modal.open({
        size: 'lg',
        template: require('./device-booking.jade'),
        controller: ModalInstanceCtrl,
        backdrop: 'static',
        resolve: {
          device: function () {
            return device
          }
        }
      })

      return modalInstance.result
    }

    return service
  }
