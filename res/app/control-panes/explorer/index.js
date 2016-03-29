require('./explorer.css')

module.exports = angular.module('stf.explorer', [])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/explorer/explorer.jade',
      require('./explorer.jade')
    )
  }])
  .filter('formatPermissionMode', function() {
    return function(mode) {
      if (mode !== null) {
        var res = []
        var s = ['x', 'w', 'r']
        for (var i = 0; i < 3; i++) {
          for (var j = 0; j < 3; j++) {
            if ((mode >> (i * 3 + j)) & 1 !== 0) {
              res.unshift(s[j])
            } else {
              res.unshift('-')
            }
          }
        }
        res.unshift(mode & 040000 ? 'd' : '-')
        return res.join('')
      }
    }
  })
  .filter('fileIsDir', function() {
    return function(m) {
      var mode = m
      if (mode !== null) {
        mode = parseInt(mode, 10)
        mode -= (mode & 0777)
        return (mode === 040000) || (mode === 0120000)
      }
    }
  })
  .filter('formatFileSize', function() {
    return function(size) {
      var formattedSize
      if (size < 1024) {
        formattedSize = size + ' B'
      } else if (size >= 1024 && size < 1024 * 1024) {
        formattedSize = Math.round(size / 1024, 1) + ' Kb'
      } else {
        formattedSize = Math.round(size / (1024 * 1024), 1) + ' Mb'
      }
      return formattedSize
    }
  })
  .filter('formatFileDate', function() {
    return function(inputString) {
      var input = new Date(inputString)
      return input instanceof Date ?
        input.toISOString().substring(0, 19).replace('T', ' ') :
        (input.toLocaleString || input.toString).apply(input)
    }
  })

  .controller('ExplorerCtrl', require('./explorer-controller'))
