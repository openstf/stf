module.exports = function addAdbKeyDirective() {
  return {
    restrict: 'E',
    //replace: true,
    //scope: {
    //  showAdd: '=',
    //  showClipboard: '='
    //},
    controller: require('./add-adb-key-controller.js'),
    template: require('./add-adb-key.jade'),
    link: function (scope) {

    }
  }
}
