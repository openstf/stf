var Promise = require('bluebird')

module.exports.periodicNotify = function(promise, interval) {
  var resolver = Promise.defer()
    , timer = setInterval(notify, interval)

  function notify() {
    resolver.progress()
  }

  function resolve(value) {
    resolver.resolve(value)
  }

  function reject(err) {
    resolver.reject(err)
  }

  promise.then(resolve, reject)

  return resolver.promise.finally(function() {
    clearInterval(timer)
  })
}
