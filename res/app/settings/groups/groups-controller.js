/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

const _ = require('lodash')
const Promise = require('bluebird')

module.exports = function GroupsCtrl(
  $scope
, $filter
, GroupsService
, UserService
, UsersService
, DevicesService
, SettingsService
, ItemsPerPageOptionsService
, GenericModalService
, CommonService
) {
  const originDevices = []
  const originDevicesBySerial = {}
  const standardizableDevices = []
  const standardizableDevicesBySerial = {}
  const groupsById = {}
  const cachedGroupsClass = {}
  const deviceFields =
    'serial,' +
    'model,' +
    'version,' +
    'operator,' +
    'network.type,' +
    'network.subtype,' +
    'display.height,' +
    'display.width,' +
    'manufacturer,' +
    'sdk,' +
    'abi,' +
    'cpuPlatform,' +
    'openGLESVersion,' +
    'phone.imei,' +
    'provider.name,' +
    'group.originName'
  const userFields =
    'email,' +
    'name,' +
    'privilege,' +
    'groups.subscribed,' +
    'groups.quotas.allocated,' +
    'groups.quotas.consumed'
  var rootGroupId

  function publishDevice(device) {
    if (!device.model) {
      device.display = device.phone = device.network = {}
    }
    else {
      device.displayStr = device.display.width + 'x' + device.display.height
      device.networkStr = $scope.computeNetwork(device)
    }
    return device
  }

  function initAvailableGroupDevices(group, availableDevices, availableDevicesBySerial) {
    $scope.groupsEnv[group.id].availableDevices = availableDevices
    $scope.groupsEnv[group.id].availableDevicesBySerial = availableDevicesBySerial
    $scope.groupsEnv[group.id].availableDevices.forEach(function(device) {
      publishDevice(device)
    })
  }

  function getAvailableGroupDevices(group) {
    if (group.class === 'bookable') {
      initAvailableGroupDevices(group, originDevices, originDevicesBySerial)
    }
    else if (group.class === 'standard') {
      initAvailableGroupDevices(group, standardizableDevices, standardizableDevicesBySerial)
    }
    else if ($scope.groupsEnv[group.id].showDevices) {
      GroupsService.getGroupDevices(group.id, true, deviceFields).then(function(response) {
        if (CommonService.isExisting($scope.groupsEnv[group.id])) {
          $scope.groupsEnv[group.id].availableDevicesBySerial = {}
          $scope.groupsEnv[group.id].availableDevices = []
          response.data.devices.forEach(function(device) {
            addAvailableGroupDevice(group.id, device, -1)
          })
          initAvailableGroupDevices(
            group
          , $scope.groupsEnv[group.id].availableDevices
          , $scope.groupsEnv[group.id].availableDevicesBySerial)
        }
      })
    }
  }

  function checkDurationQuota(group, deviceNumber, startDate, stopDate, repetitions) {
    if (CommonService.isOriginGroup(group.class)) {
      return true
    }
    if (CommonService.isExisting($scope.usersByEmail[group.owner.email])) {
      const duration =
        (group.devices.length + deviceNumber) *
        ((new Date(stopDate)) - (new Date(startDate))) *
        (repetitions + 1)

      if (duration <=
          $scope.users[$scope.usersByEmail[group.owner.email].index]
                .groups.quotas.allocated.duration) {
        return true
      }
    }
    return false
  }

  function isBookedDevice(serial) {
    if (CommonService.isExisting(originDevicesBySerial[serial])) {
      for(var i in $scope.groups) {
        if (!CommonService.isOriginGroup($scope.groups[i].class) &&
            $scope.groups[i].devices.indexOf(serial) > -1) {
          return true
        }
      }
    }
    return false
  }

  function addStandardizableDevicesIfNotBooked(devices, timeStamp) {
    devices.forEach(function(serial) {
      if (!isBookedDevice(serial)) {
        addStandardizableDevice(
          originDevices[originDevicesBySerial[serial].index]
        , timeStamp
        )
      }
    })
  }

  function updateStandardizableDeviceIfNotBooked(device, timeStamp) {
    if (!isBookedDevice(device.serial)) {
      updateStandardizableDevice(device, timeStamp)
    }
  }

  function initGroup(group) {
    cachedGroupsClass[group.id] = group.class
    if (typeof $scope.groupsEnv[group.id] === 'undefined') {
      $scope.groupsEnv[group.id] = {}
      initAvailableGroupDevices(group, [], {})
      if (group.privilege === 'root') {
        rootGroupId = group.id
      }
    }
    return group
  }

  function addGroup(group, timeStamp) {
    if (CommonService.add($scope.groups, groupsById, group, 'id', timeStamp)) {
      return initGroup(group)
    }
    return null
  }

  function updateGroup(group, timeStamp, noAdding) {
    if (CommonService.update($scope.groups, groupsById, group, 'id', timeStamp, noAdding)) {
      return initGroup($scope.groups[groupsById[group.id].index])
    }
    return null
  }

  function deleteGroup(id, timeStamp) {
    const group = CommonService.delete($scope.groups, groupsById, id, timeStamp)

    if (group) {
      delete $scope.groupsEnv[group.id]
    }
    return group
  }

  function addOriginDevice(device, timeStamp) {
    return CommonService.add(originDevices, originDevicesBySerial, device, 'serial', timeStamp)
  }

  function updateOriginDevice(device, timeStamp) {
    return CommonService.update(originDevices, originDevicesBySerial, device, 'serial', timeStamp)
  }

  function deleteOriginDevice(serial, timeStamp) {
    return CommonService.delete(originDevices, originDevicesBySerial, serial, timeStamp)
  }

  function addStandardizableDevice(device, timeStamp) {
    return CommonService.add(
      standardizableDevices, standardizableDevicesBySerial, device, 'serial', timeStamp)
  }

  function updateStandardizableDevice(device, timeStamp) {
    return CommonService.update(
      standardizableDevices, standardizableDevicesBySerial, device, 'serial', timeStamp)
  }

  function deleteStandardizableDevice(serial, timeStamp) {
    return CommonService.delete(
      standardizableDevices, standardizableDevicesBySerial, serial, timeStamp)
  }

  function addAvailableGroupDevice(id, device, timeStamp) {
    return CommonService.add(
      $scope.groupsEnv[id].availableDevices
    , $scope.groupsEnv[id].availableDevicesBySerial, device, 'serial', timeStamp)
  }

  function updateAvailableGroupDevice(id, device, timeStamp, noAdding) {
    return CommonService.update(
      $scope.groupsEnv[id].availableDevices
    , $scope.groupsEnv[id].availableDevicesBySerial, device, 'serial', timeStamp, noAdding)
  }

  function deleteAvailableGroupDevice(id, serial, timeStamp) {
    return CommonService.delete(
      $scope.groupsEnv[id].availableDevices
    , $scope.groupsEnv[id].availableDevicesBySerial, serial, timeStamp)
  }

  function addUser(user, timeStamp) {
    return CommonService.add($scope.users, $scope.usersByEmail, user, 'email', timeStamp)
  }

  function updateUser(user, timeStamp) {
    return CommonService.update($scope.users, $scope.usersByEmail, user, 'email', timeStamp)
  }

  function deleteUser(email, timeStamp) {
    return CommonService.delete($scope.users, $scope.usersByEmail, email, timeStamp)
  }

  function initScope() {
    GroupsService.getOboeMyGroups(function(group) {
      addGroup(group, -1)
    })
    .done(function() {
      $scope.$digest()
    })

    UsersService.getOboeUsers(userFields, function(user) {
      addUser(user, -1)
    })
    .done(function() {
      if (CommonService.isExisting($scope.usersByEmail[$scope.currentUser.email])) {
        $scope.users[$scope.usersByEmail[$scope.currentUser.email].index] = $scope.currentUser
      }
    })

    UserService.getUser().then(function(response) {
      CommonService.merge($scope.currentUser, response.data.user)
    })

    if ($scope.isAdmin()) {
      DevicesService.getOboeDevices('origin', deviceFields, function(device) {
        addOriginDevice(device, -1)
      })
      DevicesService.getOboeDevices('standardizable', deviceFields, function(device) {
        addStandardizableDevice(device, -1)
      })
    }
  }

  $scope.currentUser = CommonService.merge({}, UserService.currentUser)
  $scope.users = []
  $scope.usersByEmail = {}
  $scope.groups = []
  $scope.groupsEnv = {}
  $scope.confirmRemove = {value: true}
  $scope.scopeGroupsCtrl = $scope
  $scope.itemsPerPageOptions = ItemsPerPageOptionsService

  SettingsService.bind($scope, {
    target: 'groupItemsPerPage'
  , source: 'groupItemsPerPage'
  , defaultValue: $scope.itemsPerPageOptions[2]
  })

  $scope.userColumns = [
    {name: 'Name', property: 'name'}
  , {name: 'Email', property: 'email'}
  , {name: 'Privilege', property: 'privilege'}
  ]
  $scope.defaultUserData = {
    columns: [
      {name: 'Name', sort: 'sort-asc'}
    , {name: 'Email', sort: 'none'}
    , {name: 'Privilege', sort: 'none'}
    ]
  , sort: {index: 0, reverse: false}
  }
  SettingsService.bind($scope, {
    target: 'userData'
  , source: 'userData'
  , defaultValue: $scope.defaultUserData
  })
  SettingsService.bind($scope, {
    target: 'groupUserData'
  , source: 'groupUserData'
  , defaultValue: $scope.defaultUserData
  })

  $scope.conflictColumns = [
    {name: 'Serial', property: 'serial'}
  , {name: 'Starting Date', property: 'startDate'}
  , {name: 'Expiration Date', property: 'stopDate'}
  , {name: 'Group Name', property: 'group'}
  , {name: 'Group Owner', property: 'ownerName'}
  ]
  $scope.defaultConflictData = {
    columns: [
      {name: 'Serial', sort: 'sort-asc'}
    , {name: 'Starting Date', sort: 'none'}
    , {name: 'Expiration Date', sort: 'none'}
    , {name: 'Group Name', sort: 'none'}
    , {name: 'Group Owner', sort: 'none'}
    ]
  , sort: {index: 0, reverse: false}
  }
  SettingsService.bind($scope, {
    target: 'conflictData'
  , source: 'conflictData'
  , defaultValue: $scope.defaultConflictData
  })

  $scope.mailToGroupOwners = function(groups) {
    CommonService.copyToClipboard(_.uniq(groups.map(function(group) {
      return group.owner.email
    }))
    .join(SettingsService.get('emailSeparator')))
    .url('mailto:?body=*** Paste the email addresses from the clipboard! ***')
  }

  $scope.mailToGroupUsers = function(group, users) {
    // group unused actually..
    $scope.mailToAvailableUsers(users)
  }

  $scope.mailToAvailableUsers = function(users) {
    CommonService.copyToClipboard(users.map(function(user) {
      return user.email
    })
    .join(SettingsService.get('emailSeparator')))
    .url('mailto:?body=*** Paste the email addresses from the clipboard! ***')
  }

  $scope.getGroupIndex = function(relativeIndex) {
    return relativeIndex + ($scope.groupCurrentPage - 1) * $scope.groupItemsPerPage.value
  }

  $scope.computeDisplay = function(device) {
    return device.display.width * device.display.height
  }

  $scope.computeNetwork = function(device) {
    if (!device.network || !device.network.type) {
      return ''
    }
    else if (device.network.subtype) {
      return device.network.type + ' (' + device.network.subtype + ')'
    }
    return device.network.type
  }

  $scope.resetDeviceData = function() {
    $scope.deviceData = JSON.parse(JSON.stringify($scope.defaultDeviceData))
  }

  $scope.resetGroupDeviceData = function() {
    $scope.groupDeviceData = JSON.parse(JSON.stringify($scope.defaultDeviceData))
  }

  $scope.deviceColumns = [
    {name: 'Model', property: 'model'}
  , {name: 'Serial', property: 'serial'}
  , {name: 'Carrier', property: 'operator'}
  , {name: 'OS', property: 'version'}
  , {name: 'Network', property: $scope.computeNetwork}
  , {name: 'Screen', property: $scope.computeDisplay}
  , {name: 'Manufacturer', property: 'manufacturer'}
  , {name: 'SDK', property: 'sdk'}
  , {name: 'ABI', property: 'abi'}
  , {name: 'CPU Platform', property: 'cpuPlatform'}
  , {name: 'OpenGL ES version', property: 'openGLESVersion'}
  , {name: 'Phone IMEI', property: 'phone.imei'}
  , {name: 'Location', property: 'provider.name'}
  , {name: 'Group Origin', property: 'group.originName'}
  ]
  $scope.defaultDeviceData = {
    columns: [
      {name: 'Model', selected: true, sort: 'sort-asc'}
    , {name: 'Serial', selected: true, sort: 'none'}
    , {name: 'Carrier', selected: false, sort: 'none'}
    , {name: 'OS', selected: true, sort: 'none'}
    , {name: 'Network', selected: false, sort: 'none'}
    , {name: 'Screen', selected: true, sort: 'none'}
    , {name: 'Manufacturer', selected: true, sort: 'none'}
    , {name: 'SDK', selected: true, sort: 'none'}
    , {name: 'ABI', selected: false, sort: 'none'}
    , {name: 'CPU Platform', selected: false, sort: 'none'}
    , {name: 'OpenGL ES version', selected: false, sort: 'none'}
    , {name: 'Phone IMEI', selected: false, sort: 'none'}
    , {name: 'Location', selected: true, sort: 'none'}
    , {name: 'Group Origin', selected: true, sort: 'none'}
    ]
  , sort: {index: 0, reverse: false}
  }
  SettingsService.bind($scope, {
    target: 'deviceData'
  , source: 'deviceData'
  , defaultValue: $scope.defaultDeviceData
  })
  SettingsService.bind($scope, {
    target: 'groupDeviceData'
  , source: 'groupDeviceData'
  , defaultValue: $scope.defaultDeviceData
  })
  $scope.nameRegex = /^[0-9a-zA-Z-_./: ]{1,50}$/
  $scope.nameRegexStr = '/^[0-9a-zA-Z-_./: ]{1,50}$/'
  $scope.classOptions = CommonService.classOptions
  $scope.getClassName = CommonService.getClassName
  $scope.sortBy = CommonService.sortBy

  $scope.isAdmin = function() {
    return $scope.currentUser.privilege === 'admin'
  }

  $scope.getRepetitionsQuotas = function(email) {
    if (CommonService.isExisting($scope.usersByEmail[email])) {
      return $scope.users[$scope.usersByEmail[email].index].groups.quotas.repetitions
    }
    return null
  }

  $scope.initShowDevices = function(group, showDevices) {
    if (typeof $scope.groupsEnv[group.id].groupDeviceCurrentPage === 'undefined') {
      $scope.groupsEnv[group.id].groupDeviceCurrentPage = 1
      $scope.groupsEnv[group.id].groupDeviceItemsPerPage = $scope.itemsPerPageOptions[1]
      $scope.groupsEnv[group.id].availableDeviceCurrentPage = 1
      $scope.groupsEnv[group.id].availableDeviceItemsPerPage = $scope.itemsPerPageOptions[1]
    }
    $scope.groupsEnv[group.id].showDevices = showDevices
    getAvailableGroupDevices(group)
  }

  $scope.initShowUsers = function(group) {
    if (typeof $scope.groupsEnv[group.id].groupUserCurrentPage === 'undefined') {
      $scope.groupsEnv[group.id].groupUserCurrentPage = 1
      $scope.groupsEnv[group.id].groupUserItemsPerPage = $scope.itemsPerPageOptions[1]
      $scope.groupsEnv[group.id].availableUserCurrentPage = 1
      $scope.groupsEnv[group.id].availableUserItemsPerPage = $scope.itemsPerPageOptions[1]
    }
  }

  $scope.watchGroupClass = function(group) {
    if (CommonService.isNoRepetitionsGroup($scope.groupsEnv[group.id].tmpClass)) {
      $scope.groupsEnv[group.id].tmpRepetitions = 0
    }
    else if ($scope.groupsEnv[group.id].tmpRepetitions === 0) {
      $scope.groupsEnv[group.id].tmpRepetitions = 1
    }
  }

  $scope.initTemporaryName = function(group) {
    $scope.groupsEnv[group.id].tmpName = group.name
    $scope.groupsEnv[group.id].tmpNameTooltip = 'No change'
  }

  $scope.initTemporarySchedule = function(group) {
    $scope.groupsEnv[group.id].tmpClass = group.class
    $scope.groupsEnv[group.id].tmpRepetitions = group.repetitions
    $scope.groupsEnv[group.id].tmpStartDate = new Date(group.dates[0].start)
    $scope.groupsEnv[group.id].tmpStopDate = new Date(group.dates[0].stop)
    $scope.groupsEnv[group.id].tmpScheduleTooltip = 'No change'
  }

  $scope.conditionForDevicesAddition = function(group, deviceNumber) {
    return checkDurationQuota(
      group
    , deviceNumber
    , group.dates[0].start
    , group.dates[0].stop
    , group.repetitions
    )
  }

  $scope.conditionForGroupCreation = function() {
    return $scope.currentUser.groups.quotas.consumed.number <
           $scope.currentUser.groups.quotas.allocated.number
  }

  $scope.conditionForGroupUsersRemoving = function(group, users) {
    return !(users.length === 0 ||
             group.privilege === 'root' && users.length === 1 && users[0].privilege === 'admin' ||
             group.privilege !== 'root' &&
               (users.length === 2 &&
                (users[0].privilege === 'admin' && users[1].email === group.owner.email ||
                 users[0].email === group.owner.email && users[1].privilege === 'admin') ||
                users.length === 1 &&
                (users[0].email === group.owner.email || users[0].privilege === 'admin'))
            )
  }

  $scope.conditionForNameSaving = function(group, formInvalidStatus) {
    return !formInvalidStatus && $scope.groupsEnv[group.id].tmpName !== group.name
  }

  $scope.conditionForScheduleSaving = function(group, formInvalidStatus) {
    if (formInvalidStatus) {
      $scope.groupsEnv[group.id].tmpScheduleTooltip = 'Bad syntax'
      return false
    }
    if ($scope.groupsEnv[group.id].tmpClass !== group.class ||
        parseInt($scope.groupsEnv[group.id].tmpRepetitions, 10) !== group.repetitions ||
        $scope.groupsEnv[group.id].tmpStartDate.getTime() !==
        (new Date(group.dates[0].start)).getTime() ||
        $scope.groupsEnv[group.id].tmpStopDate.getTime() !==
        (new Date(group.dates[0].stop)).getTime()) {
      if (!CommonService.isNoRepetitionsGroup($scope.groupsEnv[group.id].tmpClass)) {
        if (parseInt($scope.groupsEnv[group.id].tmpRepetitions, 10) === 0) {
          $scope.groupsEnv[group.id].tmpScheduleTooltip = 'Repetitions must be > 0 for this Class'
          return false
        }
      }
      if ($scope.groupsEnv[group.id].tmpStartDate >= $scope.groupsEnv[group.id].tmpStopDate) {
        $scope.groupsEnv[group.id].tmpScheduleTooltip = 'Starting date >= Expiration date'
        return false
      }
      if (($scope.groupsEnv[group.id].tmpStopDate - $scope.groupsEnv[group.id].tmpStartDate) >
          CommonService.getClassDuration($scope.groupsEnv[group.id].tmpClass)) {
        $scope.groupsEnv[group.id].tmpScheduleTooltip =
          '(Expiration date - Starting date) must be <= Class duration'
        return false
      }
      if ($scope.isAdmin() &&
          group.devices.length &&
          (CommonService.isOriginGroup(group.class) &&
           !CommonService.isOriginGroup($scope.groupsEnv[group.id].tmpClass) ||
           CommonService.isOriginGroup($scope.groupsEnv[group.id].tmpClass) &&
           !CommonService.isOriginGroup(group.class))) {
        $scope.groupsEnv[group.id].tmpScheduleTooltip =
          'Unauthorized class while device list is not empty'
        return false
      }
      if (!checkDurationQuota(
        group
      , 0
      , $scope.groupsEnv[group.id].tmpStartDate
      , $scope.groupsEnv[group.id].tmpStopDate
      , $scope.groupsEnv[group.id].tmpRepetitions)) {
        $scope.groupsEnv[group.id].tmpScheduleTooltip = 'Group duration quotas is reached'
        return false
      }
      $scope.groupsEnv[group.id].tmpScheduleTooltip = ''
      return true
    }
    $scope.groupsEnv[group.id].tmpScheduleTooltip = 'No change'
    return false
  }

  $scope.conditionForRepetitions = function(group) {
    return !CommonService.isNoRepetitionsGroup($scope.groupsEnv[group.id].tmpClass)
  }

  $scope.addGroupDevice = function(group, device) {
    if (CommonService.isOriginGroup(group.class)) {
      CommonService.errorWrapper(
        DevicesService.addOriginGroupDevice
      , [group.id, device.serial])
    }
    else {
      CommonService.errorWrapper(
        GroupsService.addGroupDevice
        , [group.id, device.serial])
        .then(function(response) {
          if (!response.success &&
              response.status === 409 &&
              response.data.hasOwnProperty('conflicts')) {
            $scope.groupsEnv[group.id].showConflicts = true
            $scope.groupsEnv[group.id].conflicts = response.data.conflicts
          }
        })
    }
  }

  $scope.addGroupDevices = function(group, deviceSearch, filteredDevices) {
    CommonService.errorWrapper(
      CommonService.isOriginGroup(group.class) ?
        DevicesService.addOriginGroupDevices :
        GroupsService.addGroupDevices
    , deviceSearch ?
        [group.id, filteredDevices.map(function(device) { return device.serial }).join()] :
        [group.id])
  }

  $scope.removeGroupDevice = function(group, device) {
    CommonService.errorWrapper(
      CommonService.isOriginGroup(group.class) ?
        DevicesService.removeOriginGroupDevice :
        GroupsService.removeGroupDevice
    , [group.id, device.serial])
  }

  $scope.removeGroupDevices = function(group, deviceSearch, filteredDevices) {
    CommonService.errorWrapper(
      CommonService.isOriginGroup(group.class) ?
        DevicesService.removeOriginGroupDevices :
        GroupsService.removeGroupDevices
    , deviceSearch ?
        [group.id, filteredDevices.map(function(device) { return device.serial }).join()] :
        [group.id])
  }

  $scope.addGroupUser = function(group, user) {
    CommonService.errorWrapper(
      GroupsService.addGroupUser
    , [group.id, user.email])
  }

  $scope.addGroupUsers = function(group, userSearch, filteredUsers) {
    CommonService.errorWrapper(
      GroupsService.addGroupUsers
    , userSearch ?
        [group.id, filteredUsers.map(function(user) { return user.email }).join()] :
        [group.id])
  }

  $scope.removeGroupUser = function(group, user) {
    CommonService.errorWrapper(
      GroupsService.removeGroupUser
    , [group.id, user.email])
  }

  $scope.removeGroupUsers = function(group, userSearch, filteredUsers) {
    CommonService.errorWrapper(
      GroupsService.removeGroupUsers
    , userSearch ?
        [group.id, filteredUsers.map(function(user) { return user.email }).join()] :
        [group.id])
  }

  $scope.removeGroup = function(group, askConfirmation) {
    if (askConfirmation) {
      GenericModalService.open({
        message: 'Really delete this group?'
      , type: 'Warning'
      , size: 'sm'
      , cancel: true
      })
      .then(function() {
        CommonService.errorWrapper(
          GroupsService.removeGroup
        , [group.id])
      })
    }
    else {
      CommonService.errorWrapper(
        GroupsService.removeGroup
      , [group.id])
    }
  }

  $scope.removeGroups = function(search, filteredGroups, askConfirmation) {
    function removeGroups() {
      if (!search) {
        CommonService.errorWrapper(GroupsService.removeGroups)
      }
      else {
        CommonService.errorWrapper(
          GroupsService.removeGroups
        , [filteredGroups.map(function(group) { return group.id }).join()])
      }
    }

    if (askConfirmation) {
      GenericModalService.open({
        message: 'Really delete this selection of groups?'
      , type: 'Warning'
      , size: 'sm'
      , cancel: true
      })
      .then(function() {
        removeGroups()
      })
    }
    else {
      removeGroups()
    }
  }

  $scope.createGroup = function() {
    $scope.hideGroupCreation = true
    CommonService.errorWrapper(GroupsService.createGroup)
      .then(function() {
        delete $scope.hideGroupCreation
      })
  }

  $scope.updateGroupSchedule = function(group) {
    CommonService.errorWrapper(GroupsService.updateGroup, [group.id, {
      'class': $scope.groupsEnv[group.id].tmpClass
    , 'repetitions': parseInt($scope.groupsEnv[group.id].tmpRepetitions, 10)
    , 'startTime': $scope.groupsEnv[group.id].tmpStartDate
    , 'stopTime': $scope.groupsEnv[group.id].tmpStopDate
    }])
    .then(function(response) {
      if (!response.success &&
          response.status === 409 &&
          response.data.hasOwnProperty('conflicts')) {
        $scope.groupsEnv[group.id].conflicts = []
        response.data.conflicts.forEach(function(conflict) {
          conflict.devices.forEach(function(serial) {
            $scope.groupsEnv[group.id].conflicts.push({
              serial: serial
            , startDate: $filter('date')(conflict.date.start, SettingsService.get('dateFormat'))
            , stopDate: $filter('date')(conflict.date.stop, SettingsService.get('dateFormat'))
            , group: conflict.group
            , ownerName: conflict.owner.name
            , ownerEmail: conflict.owner.email
            })
          })
        })
        $scope.groupsEnv[group.id].showConflicts = true
      }
    })
  }

  $scope.updateGroupState = function(group) {
    CommonService.errorWrapper(
      GroupsService.updateGroup
    , [group.id, {'state': 'ready'}])
  }

  $scope.updateGroupName = function(group) {
    CommonService.errorWrapper(
      GroupsService.updateGroup
    , [group.id, {'name': $scope.groupsEnv[group.id].tmpName}])
  }

  $scope.$on('user.settings.groups.updated', function(event, message) {
    const isChangedSchedule = message.isChangedDates || message.isChangedClass
    const doGetDevices =
      !CommonService.isOriginGroup(message.group.class) &&
      (isChangedSchedule || message.devices.length)
    const isGroupOwner = $scope.isAdmin() || $scope.currentUser.email === message.group.owner.email
    const group = updateGroup(
      message.group
    , message.timeStamp
    , !isGroupOwner)

    if (group) {
      if ($scope.isAdmin()) {
        if (!CommonService.isOriginGroup(group.class)) {
          if (message.devices.length) {
            if (!message.isAddedDevice) {
              addStandardizableDevicesIfNotBooked(message.devices, message.timeStamp)
            }
            else {
              message.devices.forEach(function(serial) {
                deleteStandardizableDevice(serial, message.timeStamp)
              })
            }
          }
        }
        else if (message.isChangedClass) {
          getAvailableGroupDevices(group)
        }
      }
      if (isChangedSchedule && group.state !== 'pending') {
        $scope.initTemporarySchedule(group)
      }
      if (doGetDevices) {
        $scope.groups.forEach(function(group) {
          if (group.id !== message.group.id || isChangedSchedule) {
            getAvailableGroupDevices(group)
          }
        })
      }
    }
    else if (!isGroupOwner && doGetDevices) { // a completer ... soit propriétaire et event obsolete, soit non propriétaire donc non admin
      $scope.groups.forEach(function(group) {
        getAvailableGroupDevices(group)
      })
    }
  })

  $scope.$on('user.settings.groups.created', function(event, message) {
    addGroup(message.group, message.timeStamp)
  })

  $scope.$on('user.settings.groups.deleted', function(event, message) {
    const group = message.group

    if (deleteGroup(group.id, message.timeStamp)) {
      if ($scope.isAdmin() && !CommonService.isOriginGroup(group.class)) {
        addStandardizableDevicesIfNotBooked(group.devices, message.timeStamp)
      }
    }
    if (!CommonService.isOriginGroup(group.class) && group.devices.length) {
      $scope.groups.forEach(function(group) {
        if (!CommonService.isOriginGroup(group.class)) {
          getAvailableGroupDevices(group)
        }
      })
    }
  })

  $scope.$on('user.settings.users.updated', function(event, message) {
    function getGroupClass(id) {
      if (CommonService.isExisting(groupsById[id])) {
        return Promise.resolve($scope.groups[groupsById[id].index].class)
      }
      else if (cachedGroupsClass[id]) {
        return Promise.resolve(cachedGroupsClass[id])
      }
      else {
        return GroupsService.getGroup(id).then(function(response) {
          cachedGroupsClass[id] = response.data.group.class
          return cachedGroupsClass[id]
        })
        .catch(function(error) {
          return false
        })
      }
    }

    if (($scope.isAdmin() &&
         CommonService.isExisting($scope.usersByEmail[message.user.email]) ||
         message.user.email === $scope.currentUser.email
        ) &&
        updateUser(message.user, message.timeStamp) &&
        message.groups.length) {

      Promise.map(message.groups, function(groupId) {
        return getGroupClass(groupId).then(function(_class) {
          return !_class || _class === 'bookable'
        })
      })
      .then(function(results) {
        if (_.without(results, false).length) {
          Promise.map($scope.groups, function(group) {
            if (group.owner.email === message.user.email &&
                !CommonService.isOriginGroup(group.class)) {
              getAvailableGroupDevices(group)
            }
          })
        }
      })
    }
  })

  $scope.$on('user.settings.users.created', function(event, message) {
    addUser(message.user, message.timeStamp)
  })

  $scope.$on('user.settings.users.deleted', function(event, message) {
    deleteUser(message.user.email, message.timeStamp)
  })

  $scope.$on('user.settings.devices.deleted', function(event, message) {
    if ($scope.isAdmin()) {
      deleteOriginDevice(message.device.serial, message.timeStamp)
      deleteStandardizableDevice(message.device.serial, message.timeStamp)
    }
    $scope.groups.forEach(function(group) {
      if (!CommonService.isOriginGroup(group.class)) {
        deleteAvailableGroupDevice(group.id, message.device.serial, message.timeStamp)
      }
    })
  })

  $scope.$on('user.settings.devices.created', function(event, message) {
    const device = publishDevice(message.device)

    if ($scope.isAdmin()) {
      addOriginDevice(device, message.timeStamp)
      addStandardizableDevice(device, message.timeStamp)
    }
  })

  $scope.$on('user.settings.devices.updated', function(event, message) {
    const device = publishDevice(message.device)

    if ($scope.isAdmin()) {
      updateOriginDevice(device, message.timeStamp)
      updateStandardizableDeviceIfNotBooked(device, message.timeStamp)
    }
    $scope.groups.forEach(function(group) {
      if (!CommonService.isOriginGroup(group.class)) {
        if (device.group.origin !== message.oldOriginGroupId) {
          if ($scope.currentUser.groups.subscribed.indexOf(device.group.origin) > -1) {
            getAvailableGroupDevices(group, message.timeStamp)
          }
          else {
            deleteAvailableGroupDevice(group.id, device.serial, message.timeStamp)
          }
        }
        else {
          updateAvailableGroupDevice(group.id, device, message.timeStamp, true)
        }
      }
    })
  })

  initScope()
}
