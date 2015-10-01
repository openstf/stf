require('./explorer.css')

module.exports = angular.module('stf.explorer', [])
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put('control-panes/explorer/explorer.jade',
      require('./explorer.jade')
    )
  }])
  .filter('mode2unix', function () {
    return function (mode) {
      if (mode !== null) {
        var res = [];
        var s = ['x', 'w', 'r'];
        for (var i = 0; i < 3; i++) {
          for (var j = 0; j < 3; j++) {
            if ((mode >> (i * 3 + j)) & 1 !== 0) {
              res.unshift(s[j])
            } else {
              res.unshift('-')
            }
          }
        }
        res.unshift(mode & 040000 ? 'd' : '-');
        return res.join('');
      }
    }
  })
  .filter('isdir', function () {
    return function (mode) {
      if (mode !== null) {
        mode = parseInt(mode, 10)
        mode = mode - (mode & 0777)
        return (mode == 040000) || (mode == 0120000)
      }
    }
  })
  .controller('ExplorerCtrl', require('./explorer-controller'))
