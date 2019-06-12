/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

module.exports.command = 'generate-fake-user'

module.exports.builder = function(yargs) {
  return yargs
    .strict()
    .option('n', {
      alias: 'number'
    , describe: 'How many users to create.'
    , type: 'number'
    , default: 1
    })
}

module.exports.handler = function(argv) {
  var logger = require('../../util/logger')
  var log = logger.createLogger('cli:generate-fake-user')
  var fake = require('../../util/fakeuser')
  var n = argv.number

  function next() {
    return fake.generate().then(function(email) {
      log.info('Created fake user "%s"', email)
      return --n ? next() : null
    })
  }

  return next()
    .then(function() {
      process.exit(0)
    })
    .catch(function(err) {
      log.fatal('Fake user creation had an error:', err.stack)
      process.exit(1)
    })
}
