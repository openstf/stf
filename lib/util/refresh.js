var fs = require('fs')

var watchers = Object.create(null)

function refresh() {
  process.kill('SIGHUP')
}

function collect() {
  Object.keys(require.cache).forEach(function(path) {
    if (!watchers[path]) {
      if (path.indexOf('node_modules') === -1) {
        watchers[path] = fs.watch(path, refresh)
      }
    }
  })
}

module.exports = function() {
  collect()
}
