module.exports = function ScopedHotkeysServiceFactory(hotkeys, $filter) {
  return function(scope, hotkeySet) {

    function hotkeyAdd(combo, desc, callback, preventDefault) {
      hotkeys.add({
        combo: combo,
        description: $filter('translate')(desc),
        allowIn: ['textarea', 'input'],
        callback: function(event) {
          if (preventDefault || typeof preventDefault === 'undefined') {
            event.preventDefault()
          }
          callback()
        }
      })
    }

    angular.forEach(hotkeySet, function(value) {
      hotkeyAdd(value[0], value[1], value[2], value[3])
    })

    scope.$on('$destroy', function() {
      angular.forEach(hotkeySet, function(value) {
        hotkeys.del(value[0])
      })
    })
  }
}
