var readline = require('readline')

var zmq = require('zmq')
var Promise = require('bluebird')

var logger = require('../util/logger')
var tx = require('../util/tx')

module.exports = function(options) {
  var log = logger.createLogger('console')

  // Input
  var sub = zmq.socket('sub')
  sub.subscribe('ALL')
  options.endpoints.sub.forEach(function(endpoint) {
    log.info('SUB connected to %s', endpoint)
    sub.connect(endpoint)
  })

  // Output
  var push = zmq.socket('push')
  options.endpoints.push.forEach(function(endpoint) {
    log.info('PUSH connected to %s', endpoint)
    push.connect(endpoint)
  })

  // User input
  var rl = readline.createInterface({
    input: process.stdin
  , output: process.stdout
  })
  rl.setPrompt('stf> ')
  rl.prompt()

  rl.on('line', function(line) {
    var args = line.trim().split(/\s+/g)
    switch (args.shift()) {
      case 'help':
        console.log()
        console.log('Available commands:')
        console.log()
        console.log('  help - show help')
        console.log()
        rl.prompt()
        break
      case 'ls':
        tx.q(push, sub, 'ALL', ['ls'])
          .timeout(1000)
          .then(function(results) {
            results.forEach(function(result) {
              console.log('%s', result.serial)
            })
          })
          .catch(Promise.TimeoutError, function(err) {
            console.log(err.message)
          })
          .finally(function() {
            rl.prompt()
          })
        break
      case 'shell':
        tx.q(push, sub, 'ALL', ['shell', args.join(' ')])
          .timeout(1000)
          .then(function(results) {
            results.forEach(function(result) {
              console.log('%s: %s', result.serial, result.value.toString().trim())
            })
          })
          .catch(Promise.TimeoutError, function(err) {
            console.log(err.message)
          })
          .finally(function() {
            rl.prompt()
          })
        break
      case 'exit':
      case 'quit':
        process.exit(0)
        break
      default:
        console.log('Unknown command')
        rl.prompt()
        break
    }
  })

}
