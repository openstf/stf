/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

const _ = require('lodash')

module.exports = function UsersCtrl(
  $scope
, UsersService
, AppState
, SettingsService
, ItemsPerPageOptionsService
, GenericModalService
, CommonService
) {
  const usersByEmail = {}
  const userFields =
    'email,' +
    'name,' +
    'privilege,' +
    'groups.quotas'

  function addUser(user, timeStamp) {
    return CommonService.add(
      $scope.users
    , usersByEmail
    , user
    , 'email'
    , timeStamp)
  }

  function updateUser(user, timeStamp) {
    return CommonService.update(
      $scope.users
    , usersByEmail
    , user
    , 'email'
    , timeStamp)
  }

  function deleteUser(email, timeStamp) {
    return CommonService.delete(
      $scope.users
    , usersByEmail
    , email
    , timeStamp)
  }

  function initScope() {
    UsersService.getOboeUsers(userFields, function(user) {
      addUser(user, -1)
    })
    .done(function() {
      $scope.$digest()
      if (CommonService.isExisting(usersByEmail[AppState.user.email])) {
        $scope.adminUser = $scope.users[usersByEmail[AppState.user.email].index]
      }
    })
  }

  SettingsService.bind($scope, {
    target: 'removingFilters'
  , source: 'UsersRemovingFilters'
  , defaultValue: {
      groupOwner: 'False'
    }
  })
  $scope.users = []
  $scope.confirmRemove = {value: true}
  $scope.scopeUsersCtrl = $scope
  $scope.itemsPerPageOptions = ItemsPerPageOptionsService
  SettingsService.bind($scope, {
    target: 'userItemsPerPage'
  , source: 'userItemsPerPage'
  , defaultValue: $scope.itemsPerPageOptions[2]
  })
  $scope.tmpEnv = {}
  $scope.nameRegex = /^[0-9a-zA-Z-_. ]{1,50}$/
  $scope.nameRegexStr = '/^[0-9a-zA-Z-_. ]{1,50}$/'
  $scope.removingFilterOptions = ['True', 'False', 'Any']

  $scope.mailTo = function(users) {
    CommonService.copyToClipboard(users.map(function(user) {
      return user.email
    })
    .join(SettingsService.get('emailSeparator')))
    .url('mailto:?body=*** Paste the email addresses from the clipboard! ***')
  }

  $scope.removeUser = function(email, askConfirmation) {
    if (askConfirmation) {
      GenericModalService.open({
        message: 'Really delete this user?'
      , type: 'Warning'
      , size: 'sm'
      , cancel: true
      })
      .then(function() {
        CommonService.errorWrapper(
          UsersService.removeUser
        , [email, $scope.removingFilters]
        )
      })
    }
    else {
      CommonService.errorWrapper(
        UsersService.removeUser
      , [email, $scope.removingFilters]
      )
    }
  }

  $scope.removeUsers = function(search, filteredUsers, askConfirmation) {
    function removeUsers() {
      CommonService.errorWrapper(
        UsersService.removeUsers
      , search ?
          [$scope.removingFilters, filteredUsers.map(function(user) { return user.email }).join()] :
          [$scope.removingFilters]
      )
    }

    if (askConfirmation) {
      GenericModalService.open({
        message: 'Really delete this selection of users?'
      , type: 'Warning'
      , size: 'sm'
      , cancel: true
      })
      .then(function() {
        removeUsers()
      })
    }
    else {
      removeUsers()
    }
  }

  $scope.conditionForDefaultQuotasSaving = function(formInvalidStatus) {
    if (formInvalidStatus) {
      $scope.tmpEnv.defaultQuotasTooltip = 'Bad syntax'
      return false
    }
    if ($scope.tmpEnv.defaultGroupsNumber
          !== $scope.adminUser.groups.quotas.defaultGroupsNumber ||
        $scope.tmpEnv.defaultGroupsDuration
          !== $scope.adminUser.groups.quotas.defaultGroupsDuration ||
        $scope.tmpEnv.defaultGroupsRepetitions
          !== $scope.adminUser.groups.quotas.defaultGroupsRepetitions
       ) {
      $scope.tmpEnv.defaultQuotasTooltip = ''
      return true
    }
    $scope.tmpEnv.defaultQuotasTooltip = 'No change'
    return false
  }

  $scope.initTemporaryDefaultQuotas = function() {
    $scope.tmpEnv.defaultGroupsNumber = $scope.adminUser.groups.quotas.defaultGroupsNumber
    $scope.tmpEnv.defaultGroupsDuration = $scope.adminUser.groups.quotas.defaultGroupsDuration
    $scope.tmpEnv.defaultGroupsRepetitions = $scope.adminUser.groups.quotas.defaultGroupsRepetitions
    $scope.tmpEnv.defaultQuotasTooltip = 'No change'
  }

  $scope.updateDefaultUserGroupsQuotas = function() {
    CommonService.errorWrapper(UsersService.updateDefaultUserGroupsQuotas, [
      $scope.tmpEnv.defaultGroupsNumber
    , $scope.tmpEnv.defaultGroupsDuration
    , $scope.tmpEnv.defaultGroupsRepetitions
    ])
  }

  $scope.updateUserGroupsQuotas = function(user) {
    CommonService.errorWrapper(UsersService.updateUserGroupsQuotas, [
      user.email
    , user.groupsNumber
    , user.groupsDuration
    , user.groupsRepetitions
    ])
  }

  $scope.initTemporaryUser = function() {
    $scope.tmpEnv.userName = $scope.tmpEnv.userEmail = ''
    $scope.tmpEnv.userTooltip = 'Bad syntax'
  }

  $scope.conditionForQuotasSaving = function(user, formInvalidStatus) {
    if (formInvalidStatus) {
      user.quotasTooltip = 'Bad syntax'
      return false
    }
    if (user.groupsNumber !== user.groups.quotas.allocated.number ||
        user.groupsDuration !== user.groups.quotas.allocated.duration ||
        user.groupsRepetitions !== user.groups.quotas.repetitions) {
      user.quotasTooltip = ''
      return true
    }
    user.quotasTooltip = 'No change'
    return false
  }

  $scope.initTemporaryQuotas = function(user) {
    user.groupsNumber = user.groups.quotas.allocated.number
    user.groupsDuration = user.groups.quotas.allocated.duration
    user.groupsRepetitions = user.groups.quotas.repetitions
    user.quotasTooltip = 'No change'
  }

  $scope.createUser = function() {
    CommonService.errorWrapper(
      UsersService.createUser
    , [$scope.tmpEnv.userName, $scope.tmpEnv.userEmail]
    )
  }

  $scope.$on('user.settings.users.created', function(event, message) {
    addUser(message.user, message.timeStamp)
  })

  $scope.$on('user.settings.users.deleted', function(event, message) {
    deleteUser(message.user.email, message.timeStamp)
  })

  $scope.$on('user.settings.users.updated', function(event, message) {
    updateUser(message.user, message.timeStamp)
  })

  initScope()
}
