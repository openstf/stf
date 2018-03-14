module.exports.command = 'storage-temp'

module.exports.describe = 'Start a temp storage unit.'

module.exports.builder = function(yargs) {
  var os = require('os')

  return yargs
    .env('STF_STORAGE_TEMP')
    .strict()
    .option('max-file-size', {
      describe: 'Maximum file size to allow for uploads. Note that nginx ' +
        'may have a separate limit, meaning you should change both.'
    , type: 'number'
    , default: 1 * 1024 * 1024 * 1024
    })
    .option('port', {
      alias: 'p'
    , describe: 'The port to bind to.'
    , type: 'number'
    , default: process.env.PORT || 7100
    })
    .option('save-dir', {
      describe: 'The location where files are saved to.'
    , type: 'string'
    , default: os.tmpdir()
    })
    .epilog('Each option can be be overwritten with an environment variable ' +
      'by converting the option to uppercase, replacing dashes with ' +
      'underscores and prefixing it with `STF_STORAGE_TEMP_` (e.g. ' +
      '`STF_STORAGE_TEMP_SAVE_DIR`).')
}

module.exports.handler = function(argv) {
  return require('../../units/storage/temp')({
    port: argv.port
  , saveDir: argv.saveDir
  , maxFileSize: argv.maxFileSize
  })
}
