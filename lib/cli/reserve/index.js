module.exports.command = 'reserve [name]'

module.exports.describe = 'Start a reserve unit.'

module.exports.builder = function(yargs) {
  var os = require('os')
  return yargs
    .env('STF_RESERVE')
    .strict()
    .option('connect-push', {
      alias: 'p'
    , describe: 'App-side ZeroMQ PULL endpoint to connect to.'
    , array: true
    , demand: true
    })
    .option('connect-sub', {
      alias: 's'
    , describe: 'App-side ZeroMQ PUB endpoint to connect to.'
    , array: true
    , demand: true
    })
    .option('name', {
      describe: 'An easily identifiable name for log output.'
    , type: 'string'
    , default: os.hostname()
    })
    .epilog('Each option can be be overwritten with an environment variable ' +
      'by converting the option to uppercase, replacing dashes with ' +
      'underscores and prefixing it with `STF_RESERVE_` (e.g. ' +
      '`STF_RESERVE_CONNECT_PUSH`).')
}
module.exports.handler = function(argv) {
  return require('../../units/reserve')({
    name: argv.name
  , endpoints: {
      push: argv.connectPush
    , sub: argv.connectSub
    }
  })
}
