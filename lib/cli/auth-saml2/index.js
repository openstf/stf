module.exports.command = 'auth-saml2'

module.exports.describe = 'Start a SAML 2.0 auth unit.'

module.exports.builder = function(yargs) {
  return yargs
    .env('STF_AUTH_SAML2')
    .strict()
    .option('app-url', {
      alias: 'a'
    , describe: 'URL to the app unit.'
    , type: 'string'
    , demand: true
    })
    .option('port', {
      alias: 'p'
    , describe: 'The port to bind to.'
    , type: 'number'
    , default: process.env.PORT || 7120
    })
    .option('saml-id-provider-entry-point-url', {
      describe: 'SAML 2.0 identity provider URL.'
    , type: 'string'
    , default: process.env.SAML_ID_PROVIDER_ENTRY_POINT_URL
    , demand: true
    })
    .option('saml-id-provider-issuer', {
      describe: 'SAML 2.0 identity provider issuer.'
    , type: 'string'
    , default: process.env.SAML_ID_PROVIDER_ISSUER
    , demand: true
    })
    .option('saml-id-provider-cert-path', {
      describe: 'SAML 2.0 identity provider certificate file path.'
    , type: 'string'
    , default: process.env.SAML_ID_PROVIDER_CERT_PATH
    })
    .option('saml-id-provider-callback-url', {
      describe: 'SAML 2.0 identity provider callback URL ' +
        'in the form of scheme://host[:port]/auth/saml/callback.'
    , type: 'string'
    , default: process.env.SAML_ID_PROVIDER_CALLBACK_URL
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
      'underscores and prefixing it with `STF_AUTH_SAML2_` (e.g. ' +
      '`STF_AUTH_SAML2_SECRET`). Legacy environment variables like ' +
      'SAML_ID_PROVIDER_ISSUER are still accepted, too, but consider them ' +
      'deprecated.')
}

module.exports.handler = function(argv) {
  return require('../../units/auth/saml2')({
    port: argv.port
  , secret: argv.secret
  , ssid: argv.ssid
  , appUrl: argv.appUrl
  , saml: {
      entryPoint: argv.samlIdProviderEntryPointUrl
    , issuer: argv.samlIdProviderIssuer
    , certPath: argv.samlIdProviderCertPath
    , callbackUrl: argv.samlIdProviderCallbackUrl
    }
  })
}
