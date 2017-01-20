module.exports.command = 'poorxy'

module.exports.builder = function(yargs) {
  return yargs
    .strict()
    .env('STF_POORXY')
    .option('api-url', {
      alias: 'i'
    , describe: 'URL to the api unit.'
    , type: 'string'
    , demand: true
    })
    .option('app-url', {
      alias: 'u'
    , describe: 'URL to the app unit.'
    , type: 'string'
    , demand: true
    })
    .option('auth-url', {
      alias: 'a'
    , describe: 'URL to the auth unit.'
    , type: 'string'
    , demand: true
    })
    .option('port', {
      alias: 'p'
    , describe: 'The port to launch poorxy on.'
    , type: 'number'
    , default: process.env.PORT || 7100
    })
    .option('storage-plugin-apk-url', {
      describe: 'URL to the APK storage plugin unit.'
    , type: 'string'
    , demand: true
    })
    .option('storage-plugin-image-url', {
      describe: 'URL to the image storage plugin unit.'
    , type: 'string'
    , demand: true
    })
    .option('storage-url', {
      alias: 'r'
    , describe: 'URL to the storage unit.'
    , type: 'string'
    , demand: true
    })
    .option('websocket-url', {
      alias: 'w'
    , describe: 'URL to the websocket unit.'
    , type: 'string'
    , demand: true
    })
    .epilog('Each option can be be overwritten with an environment variable ' +
      'by converting the option to uppercase, replacing dashes with ' +
      'underscores and prefixing it with `STF_POORXY_` (e.g. ' +
      '`STF_POORXY_PORT`).')
}

module.exports.handler = function(argv) {
  return require('../../units/poorxy')({
    port: argv.port
  , appUrl: argv.appUrl
  , apiUrl: argv.apiUrl
  , authUrl: argv.authUrl
  , websocketUrl: argv.websocketUrl
  , storageUrl: argv.storageUrl
  , storagePluginImageUrl: argv.storagePluginImageUrl
  , storagePluginApkUrl: argv.storagePluginApkUrl
  })
}
