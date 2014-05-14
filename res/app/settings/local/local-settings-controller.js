module.exports = function ($scope, SettingsService) {

  $scope.resetSettings = function () {
    SettingsService.clear()
    console.log('Settings cleared')
  }

  $scope.savedTo = SettingsService.driver()

//  $scope.resetSettings = function () {
//    var title = 'Reset Settings';
//    var msg = 'Are you sure you want to revert all settings to ' +
//      'their default values?';
//    var btns = [
//      {result: 'cancel', label: 'Cancel'},
//      {result: 'ok', label: 'OK', cssClass: 'btn-primary'}
//    ];
//    $dialog.messageBox(title, msg, btns)
//      .open()
//      .then(function (result) {
//        if (result === 'ok') {
//          //SettingsService.clearAll();
//        }
//      });
//  };
}
