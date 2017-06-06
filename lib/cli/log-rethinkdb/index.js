module.exports.command = 'log-rethinkdb'

module.exports.describe = 'Start a RethinkDB log unit.'

module.exports.builder = function(yargs) {
  var logger = require('../../util/logger')

  return yargs
    .env('STF_LOG_RETHINKDB')
    .strict()
    .option('connect-sub', {
      alias: 's'
    , describe: 'App-side ZeroMQ PUB endpoint to connect to.'
    , array: true
    , demand: true
    })
    .option('priority', {
      alias: 'p'
    , describe: 'Minimum log level.'
    , type: 'number'
    , default: logger.Level.IMPORTANT
    })
    .epilog('Each option can be be overwritten with an environment variable ' +
      'by converting the option to uppercase, replacing dashes with ' +
      'underscores and prefixing it with `STF_LOG_RETHINKDB_` (e.g. ' +
      '`STF_LOG_RETHINKDB_PRIORITY`).')
}

module.exports.handler = function(argv) {
  return require('../../units/log/rethinkdb')({
    priority: argv.priority
  , endpoints: {
      sub: argv.connectSub
    }
  })
}
