module.exports.command = 'generate-fake-device <model>'

module.exports.builder = function(yargs) {
  return yargs
    .strict()
    .option('n', {
      alias: 'number'
    , describe: 'How many devices to create.'
    , type: 'number'
    , default: 1
    })
}

module.exports.handler = function(argv) {
  var logger = require('../../util/logger')
  var log = logger.createLogger('cli:generate-fake-device')
  var fake = require('../../util/fakedevice')
  var n = argv.number

  function next() {
    return fake.generate(argv.model).then(function(serial) {
      log.info('Created fake device "%s"', serial)
      return --n ? next() : null
    })
  }

  return next()
    .then(function() {
      process.exit(0)
    })
    .catch(function(err) {
      log.fatal('Fake device creation had an error:', err.stack)
      process.exit(1)
    })
}
