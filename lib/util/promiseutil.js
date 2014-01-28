var Promise = require('bluebird')

module.exports.periodicNotify = function(promise, interval) {
  var resolver = Promise.defer()
    , timer = setInterval(notify, interval)

  function notify() {
    resolver.progress()
  }

  function resolve() {
    resolver.resolve()
  }

  function reject() {
    resolver.reject()
  }

  promise.then(resolve, reject)

  return resolver.promise.finally(function() {
    clearInterval(timer)
  })
}
