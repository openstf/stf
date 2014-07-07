module.exports = function ScopedHotkeysServiceFactory(hotkeys, $filter) {
  return function (scope, hotkeySet) {

    function hotkeyAdd(combo, desc, cb) {
      hotkeys.add({
        combo: combo,
        description: $filter('translate')(desc),
        allowIn: ['textarea'],
        callback: function (event) {
          event.preventDefault()
          cb()
        }
      })
    }

    angular.forEach(hotkeySet, function (value) {
      hotkeyAdd(value[0], value[1], value[2])
    })

    scope.$on('$destroy', function () {
      angular.forEach(hotkeySet, function (value) {
        hotkeys.del(value[0])
      })
    })
  }
}
