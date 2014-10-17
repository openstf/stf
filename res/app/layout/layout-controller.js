module.exports =
  function LayoutCtrl(LanguageService, $rootScope, hotkeys, $filter, gettext,
    SocketDisconnectedService) {
    LanguageService.updateLanguage()

    //SocketDisconnectedService.open()

    function toggleAdminMode() {
      var enabled = $filter('translate')(gettext('Admin mode has been enabled.'))
      var disabled = $filter('translate')(gettext('Admin mode has been disabled.'))

      $rootScope.adminMode = !$rootScope.adminMode

      alert($rootScope.adminMode ? enabled : disabled)
    }

    hotkeys.add({
      combo: 'up up down down left right left right enter',
      callback: toggleAdminMode
    })
  }
