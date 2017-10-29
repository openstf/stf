module.exports.command = 'auth-mock'

module.exports.describe = 'Start a mock auth unit that accepts any user.'

module.exports.builder = function(yargs) {
  return yargs
    .env('STF_AUTH_MOCK')
    .strict()
    .option('app-url', {
      alias: 'a'
    , describe: 'URL to the app unit.'
    , type: 'string'
    , demand: true
    })
    .option('basic-auth-password', {
      describe: 'Basic auth password (if enabled).'
    , type: 'string'
    , default: process.env.BASIC_AUTH_PASSWORD
    })
    .option('basic-auth-username', {
      describe: 'Basic auth username (if enabled).'
    , type: 'string'
    , default: process.env.BASIC_AUTH_USERNAME
    })
    .option('port', {
      alias: 'p'
    , describe: 'The port to bind to.'
    , type: 'number'
    , default: process.env.PORT || 7120
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
    .option('use-basic-auth', {
      describe: 'Whether to "secure" the login page with basic authentication.'
    , type: 'boolean'
    })
    .epilog('Each option can be be overwritten with an environment variable ' +
      'by converting the option to uppercase, replacing dashes with ' +
      'underscores and prefixing it with `STF_AUTH_MOCK_` (e.g. ' +
      '`STF_AUTH_MOCK_SECRET`). Legacy environment variables like ' +
      'BASIC_AUTH_USERNAME are still accepted, too, but consider them ' +
      'deprecated.')
}

module.exports.handler = function(argv) {
  return require('../../units/auth/mock')({
    port: argv.port
  , secret: argv.secret
  , ssid: argv.ssid
  , appUrl: argv.appUrl
  , mock: {
      useBasicAuth: argv.useBasicAuth
    , basicAuth: {
        username: argv.basicAuthUsername
      , password: argv.basicAuthPassword
      }
    }
  })
}
