require('./device-booking.less')
var _ = require('lodash')

module.exports =
  function DeviceBookingServiceFactory($modal, $location, $window, DeviceScheduleService, UserService) {
    var service = {}
    var curUser = UserService.currentUser


    var ModalInstanceCtrl = function ($scope, $modalInstance, device) {
      $scope.device = device
      $scope.events = []
      $scope.targetDate = new Date()
      $scope.newrecord = null
      $scope.selected = null
      
      // modal controll
      $scope.ok = function () {
        $modalInstance.close(true)
        // todo: something
      }

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel')
      }

      // schedule booking
      $scope.eventEdited = function (event, newStart, newEnd) {
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

      $scope.eventDeleted = function (event) {
        alert('deleted event: ' + event.title)
        DeviceScheduleService.remove({
          id: event.schedule.id
        , serial: event.schedule.serial
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

      function loadEvents() {
        DeviceScheduleService.load(device.serial, $scope.targetDate)
          .then(function(schedules) {
            $scope.events = []
            _.forEach(schedules, function(schedule){
              var own = curUser.email == schedule.email;
              $scope.events.push({
                schedule: schedule,
                title: schedule.email,
                type: own? 'success': 'warning', 
                startsAt: new Date(schedule.start),
                endsAt: new Date(schedule.end),
                deletable: own,
                draggable: own,
                resizable: own,
                cssClass: 'a-css-class-name'
              })
            })
          })
      }
      
      function validate(newSchedule) {
        var result = true
        _.forEach($scope.events, function(event) {
          var schedule = event.schedule
          if (newSchedule.id !== schedule.id &&
              newSchedule.start.getTime() < new Date(schedule.end).getTime() &&
              new Date(schedule.start).getTime() < newSchedule.end.getTime()) {
            console.log('overlapped')
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
