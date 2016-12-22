module.exports.command = 'storage-plugin-image'

module.exports.describe = 'Start an image storage plugin unit.'

module.exports.builder = function(yargs) {
  var os = require('os')

  return yargs
    .env('STF_STORAGE_PLUGIN_IMAGE')
    .strict()
    .option('concurrency', {
      alias: 'c'
    , describe: 'Maximum number of simultaneous transformations.'
    , type: 'number'
    })
    .option('port', {
      alias: 'p'
    , describe: 'The port to bind to.'
    , type: 'number'
    , default: process.env.PORT || 7100
    })
    .option('storage-url', {
      alias: 'r'
    , describe: 'URL to the storage unit.'
    , type: 'string'
    , demand: true
    })
    .option('cache-dir', {
      describe: 'The location where to cache images.'
    , type: 'string'
    , default: os.tmpdir()
    })
    .epilog('Each option can be be overwritten with an environment variable ' +
      'by converting the option to uppercase, replacing dashes with ' +
      'underscores and prefixing it with `STF_STORAGE_PLUGIN_IMAGE_` (e.g. ' +
      '`STF_STORAGE_PLUGIN_IMAGE_CONCURRENCY`).')
}

module.exports.handler = function(argv) {
  var os = require('os')

  return require('../../units/storage/plugins/image')({
    port: argv.port
  , storageUrl: argv.storageUrl
  , cacheDir: argv.cacheDir
  , concurrency: argv.concurrency || os.cpus().length
  })
}
