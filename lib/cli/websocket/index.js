module.exports.command = 'websocket'

module.exports.describe = 'Start a websocket unit.'

module.exports.builder = function(yargs) {
  var os = require('os')

  return yargs
    .env('STF_WEBSOCKET')
    .strict()
    .option('connect-push', {
      alias: 'c'
    , describe: 'App-side ZeroMQ PULL endpoint to connect to.'
    , array: true
    , demand: true
    })
    .option('connect-sub', {
      alias: 'u'
    , describe: 'App-side ZeroMQ PUB endpoint to connect to.'
    , array: true
    , demand: true
    })
    .option('port', {
      alias: 'p'
    , describe: 'The port to bind to.'
    , type: 'number'
    , default: process.env.PORT || 7110
    })
    .option('secret', {
      alias: 's'
    , describe: 'The secret to use for auth JSON Web Tokens. Anyone who ' +
        'knows this token can freely enter the system if they want, so keep ' +
        'it safe.'
    , type: 'string'
    , default: process.env.SECRET
    , demand: true
    })
    .option('ssid', {
      alias: 'i'
    , describe: 'The name of the session ID cookie.'
    , type: 'string'
    , default: process.env.SSID || 'ssid'
    })
    .option('storage-url', {
      alias: 'r'
    , describe: 'URL to the storage unit.'
    , type: 'string'
    , demand: true
    })
    // TODO testexecutor related
    .option('save-dir', {
      describe: 'The location where files are saved to. Note that you probably also' +
        'want to change the save dir for storage temp, as it uses the same directory.'
      , type: 'string'
      , default: os.tmpdir()
    })
    .option('emulator-docker-repository', {
      describe: 'The Docker repository of the emulators, that should be used ' +
        'when emulators are spawned.'
      , type: 'string'
      , default: 'https://github.com/uds-se/droidmatedockerenv.git#emulator'
    })
    .option('apk-dir-container', {
      describe: 'The directory inside Docker containers, that contains the apk(s) ' +
        'or when apk(s) are uploaded, will be copied into this directory.'
      , type: 'string'
      , default: '/root/apks'
    })
    .option('tool-output-dir-container', {
      describe: 'The directory inside Docker containers, that is supposed to be ' +
        'the output directory for the tools output data e.g. reports.'
      , type: 'string'
      , default: '/root/output'
    })
    .option('auth-token', {
      describe: 'The authentication token for the REST API in order to get the remote ' +
        'connect url for physical devices. Only necessary for physical devices.'
      , type: 'string'
      , default: ''
    })
    .option('adb-keys-dir-host', {
      describe: 'The directory containing adb keys for the adb server authentication loaded ' +
        'inside the Docker container. Only necessary for physical devices.'
      , type: 'string'
      , default: '~/.android/'
    })
    .option('rest-url', {
      describe: 'The base URL for the REST API requests.'
      , type: 'string'
    })
    .epilog('Each option can be be overwritten with an environment variable ' +
      'by converting the option to uppercase, replacing dashes with ' +
      'underscores and prefixing it with `STF_WEBSOCKET_` (e.g. ' +
      '`STF_WEBSOCKET_STORAGE_URL`).')
}

module.exports.handler = function(argv) {
  return require('../../units/websocket')({
    port: argv.port
  , secret: argv.secret
  , ssid: argv.ssid
  , storageUrl: argv.storageUrl
  , endpoints: {
      sub: argv.connectSub
    , push: argv.connectPush
    }
  // Testexecutor related
  , saveDir: argv.saveDir
  , emulatorDockerRepository: argv.emulatorDockerRepository
  , apkDirContainer: argv.apkDirContainer
  , toolOutputDirContainer: argv.toolOutputDirContainer
  , authToken: argv.authToken
  , adbKeysDirHost: argv.adbKeysDirHost
  , restUrl: argv.restUrl
  })
}
