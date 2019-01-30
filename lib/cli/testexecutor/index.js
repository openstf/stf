module.exports.command = 'testexecutor'

module.exports.describe = 'Start a testexecutor unit.'

// TODO shift all testexeuctor related options from the websocket unit into here
module.exports.builder = function(yargs) {
  var os = require('os')

  return yargs
    .env('STF_TESTEXECUTOR')
    .strict()
    .option('cleanup-time-interval', {
      describe: 'The time interval for the periodic Docker cleanup in days.'
      , type: 'number'
      , default: 1
    })
    .option('container-expiration', {
      describe: 'The number of days for the Docker containers to live before the ' +
        'periodic Docker cleanup removes them.'
      , type: 'number'
      , default: 9
    })
    .option('save-dir', {
      describe: 'The location where files are saved to. Note that you probably also' +
        'want to change the save dir for storage temp, as it uses the same directory.'
      , type: 'string'
      , default: os.tmpdir()
    })
    .epilog('Each option can be be overwritten with an environment variable ' +
      'by converting the option to uppercase, replacing dashes with ' +
      'underscores and prefixing it with `STF_TESTEXECUTOR_` (e.g. ' +
      '`STF_CONTAINER_EXPIRATION`).')
}

module.exports.handler = function(argv) {
  return require('../../units/testexecutor')({
    cleanupTimeInterval: argv.cleanupTimeInterval
  , containerExpiration: argv.containerExpiration
  , saveDir: argv.saveDir
  })
}
