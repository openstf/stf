module.exports.command = 'auth-openid'

module.exports.describe = 'Start an OpenID auth unit.'

module.exports.builder = function(yargs) {
  return yargs
    .env('STF_AUTH_OPENID')
    .strict()
    .option('app-url', {
      alias: 'a'
    , describe: 'URL to the app unit.'
    , type: 'string'
    , demand: true
    })
    .option('openid-identifier-url', {
      describe: 'OpenID identifier URL.'
    , type: 'string'
    , default: process.env.OPENID_IDENTIFIER_URL
    , demand: true
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
    .epilog('Each option can be be overwritten with an environment variable ' +
      'by converting the option to uppercase, replacing dashes with ' +
      'underscores and prefixing it with `STF_AUTH_OPENID_` (e.g. ' +
      '`STF_AUTH_OPENID_SECRET`). Legacy environment variables like ' +
      'OPENID_IDENTIFIER_URL are still accepted, too, but consider them ' +
      'deprecated.')
}

module.exports.handler = function(argv) {
  return require('../../units/auth/openid')({
    port: argv.port
  , secret: argv.secret
  , appUrl: argv.appUrl
  , openid: {
      identifierUrl: argv.openidIdentifierUrl
    }
  })
}
