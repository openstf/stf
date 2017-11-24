module.exports.command = 'stats-collector'

module.exports.describe = 'Start a device usage stats collector unit.'

module.exports.builder = function(yargs) {
  return yargs
    .env('STF_STATS_COLLECTOR')
    .strict()
    .option('connect-sub', {
      alias: 'u'
    , describe: 'App-side ZeroMQ PUB endpoint to connect to.'
    , array: true
    , demand: true
    })
    .epilog('Each option can be be overwritten with an environment variable ' +
    'by converting the option to uppercase, replacing dashes with ' +
    'underscores and prefixing it with `STF_STATS_COLLECTOR_` (e.g. ' +
    '`STF_STATS_COLLECTOR_CONNECT_SUB`).')
}

module.exports.handler = function(argv) {
  return require('../../units/stats-collector')({
    endpoints: {
      sub: argv.connectSub
    }
  })
}
