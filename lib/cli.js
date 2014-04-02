var util = require('util')
var os = require('os')

var program = require('commander')
var Promise = require('bluebird')
var ip = require('my-local-ip')

var pkg = require('../package')
var cliutil = require('./util/cliutil')
var procutil = require('./util/procutil')
var logger = require('./util/logger')

Promise.longStackTraces()

program
  .version(pkg.version)

program
  .command('provider [serial..]')
  .description('start provider')
  .option('-s, --connect-sub <endpoint>'
    , 'sub endpoint'
    , cliutil.list)
  .option('-p, --connect-push <endpoint>'
    , 'push endpoint'
    , cliutil.list)
  .option('-n, --name <name>'
    , 'name (or os.hostname())'
    , String
    , os.hostname())
  .option('--min-port <port>'
    , 'minimum port number for worker use'
    , Number
    , 7400)
  .option('--max-port <port>'
    , 'maximum port number for worker use (total must be multiple of 3)'
    , Number
    , 7700)
  .option('--public-ip <ip>'
    , 'public ip for global access'
    , String
    , ip())
  .action(function() {
    var serials = cliutil.allUnknownArgs(arguments)
      , options = cliutil.lastArg(arguments)

    if (!options.connectSub) {
      this.missingArgument('--connect-sub')
    }
    if (!options.connectPush) {
      this.missingArgument('--connect-push')
    }

    require('./roles/provider')({
      name: options.name
    , killTimeout: 10000
    , ports: cliutil.range(options.minPort, options.maxPort)
    , filter: function(device) {
        return serials.length === 0 || serials.indexOf(device.id) !== -1
      }
    , fork: function(device, ports) {
        var fork = require('child_process').fork
        return fork(__filename, [
          'device', device.id
        , '--provider', options.name
        , '--connect-sub', options.connectSub.join(',')
        , '--connect-push', options.connectPush.join(',')
        , '--ports', ports.join(',')
        , '--public-ip', options.publicIp
        ])
      }
    , endpoints: {
        sub: options.connectSub
      , push: options.connectPush
      }
    })
  })

program
  .command('device <serial>')
  .description('start device worker')
  .option('-n, --provider <name>'
    , 'provider name'
    , String)
  .option('-s, --connect-sub <endpoint>'
    , 'sub endpoint'
    , cliutil.list)
  .option('-p, --connect-push <endpoint>'
    , 'push endpoint'
    , cliutil.list)
  .option('--ports <ports>'
    , 'ports allocated to worker'
    , cliutil.list)
  .option('--public-ip <ip>'
    , 'public ip for global access'
    , String
    , ip())
  .option('--heartbeat-interval <ms>'
    , 'heartbeat interval'
    , Number
    , 10000)
  .action(function(serial, options) {
    if (!options.connectSub) {
      this.missingArgument('--connect-sub')
    }
    if (!options.connectPush) {
      this.missingArgument('--connect-push')
    }
    if (!options.provider) {
      this.missingArgument('--provider')
    }
    if (!options.ports) {
      this.missingArgument('--ports')
    }

    require('./roles/device')({
      serial: serial
    , provider: options.provider
    , ports: options.ports
    , publicIp: options.publicIp
    , endpoints: {
        sub: options.connectSub
      , push: options.connectPush
      }
    , heartbeatInterval: options.heartbeatInterval
    })
  })

program
  .command('processor <name>')
  .description('start processor')
  .option('-a, --connect-app-dealer <endpoint>'
    , 'app dealer endpoint'
    , cliutil.list)
  .option('-d, --connect-dev-dealer <endpoint>'
    , 'device dealer endpoint'
    , cliutil.list)
  .action(function(name, options) {
    if (!options.connectAppDealer) {
      this.missingArgument('--connect-app-dealer')
    }
    if (!options.connectDevDealer) {
      this.missingArgument('--connect-dev-dealer')
    }

    require('./roles/processor')({
      name: name
    , endpoints: {
        appDealer: options.connectAppDealer
      , devDealer: options.connectDevDealer
      }
    })
  })

program
  .command('reaper <name>')
  .description('start reaper')
  .option('-p, --connect-push <endpoint>'
    , 'push endpoint'
    , cliutil.list)
  .option('-t, --heartbeat-timeout <ms>'
    , 'consider devices with heartbeat older than this value dead'
    , Number
    , 20000)
  .option('-i, --reap-interval <ms>'
    , 'reap interval'
    , Number
    , 10000)
  .action(function(name, options) {
    require('./roles/reaper')({
      name: name
    , heartbeatTimeout: options.heartbeatTimeout
    , reapInterval: options.reapInterval
    , endpoints: {
        push: options.connectPush
      }
    })
  })

program
  .command('triproxy <name>')
  .description('start triproxy')
  .option('-u, --bind-pub <endpoint>'
    , 'pub endpoint'
    , String
    , 'tcp://*:7111')
  .option('-d, --bind-dealer <endpoint>'
    , 'dealer endpoint'
    , String
    , 'tcp://*:7112')
  .option('-p, --bind-pull <endpoint>'
    , 'pull endpoint'
    , String
    , 'tcp://*:7113')
  .action(function(name, options) {
    require('./roles/triproxy')({
      name: name
    , endpoints: {
        pub: options.bindPub
      , dealer: options.bindDealer
      , pull: options.bindPull
      }
    })
  })

program
  .command('auth-ldap')
  .description('start LDAP auth client')
  .option('-p, --port <port>'
    , 'port (or $PORT)'
    , Number
    , process.env.PORT || 7120)
  .option('-s, --secret <secret>'
    , 'secret (or $SECRET)'
    , String
    , process.env.SECRET)
  .option('-i, --ssid <ssid>'
    , 'session SSID (or $SSID)'
    , String
    , process.env.SSID || 'ssid')
  .option('-a, --app-url <url>'
    , 'URL to app'
    , String)
  .option('-u, --ldap-url <url>'
    , 'LDAP server URL (or $LDAP_URL)'
    , String
    , process.env.LDAP_URL)
  .option('-t, --ldap-timeout <timeout>'
    , 'LDAP timeout (or $LDAP_TIMEOUT)'
    , Number
    , process.env.LDAP_TIMEOUT || 1000)
  .option('--ldap-bind-dn <dn>'
    , 'LDAP bind DN (or $LDAP_BIND_DN)'
    , String
    , process.env.LDAP_BIND_DN)
  .option('--ldap-bind-credentials <credentials>'
    , 'LDAP bind credentials (or $LDAP_BIND_CREDENTIALS)'
    , String
    , process.env.LDAP_BIND_CREDENTIALS)
  .option('--ldap-search-dn <dn>'
    , 'LDAP search DN (or $LDAP_SEARCH_DN)'
    , String
    , process.env.LDAP_SEARCH_DN)
  .option('--ldap-search-scope <scope>'
    , 'LDAP search scope (or $LDAP_SEARCH_SCOPE)'
    , String
    , process.env.LDAP_SEARCH_SCOPE || 'sub')
  .option('--ldap-search-class <class>'
    , 'LDAP search objectClass (or $LDAP_SEARCH_CLASS)'
    , String
    , process.env.LDAP_SEARCH_CLASS || 'top')
  .option('--ldap-search-field <name>'
    , 'LDAP search field (or $LDAP_SEARCH_FIELD)'
    , String
    , process.env.LDAP_SEARCH_FIELD)
  .action(function(options) {
    if (!options.secret) {
      this.missingArgument('--secret')
    }
    if (!options.appUrl) {
      this.missingArgument('--app-url')
    }

    require('./roles/auth/ldap')({
      port: options.port
    , secret: options.secret
    , ssid: options.ssid
    , appUrl: options.appUrl
    , ldap: {
        url: options.ldapUrl
      , timeout: options.ldapTimeout
      , bind: {
          dn: options.ldapBindDn
        , credentials: options.ldapBindCredentials
        }
      , search: {
          dn: options.ldapSearchDn
        , scope: options.ldapSearchScope
        , objectClass: options.ldapSearchClass
        , field: options.ldapSearchField
        }
      }
    })
  })

program
  .command('auth-mock')
  .description('start mock auth client')
  .option('-p, --port <port>'
    , 'port (or $PORT)'
    , Number
    , process.env.PORT || 7120)
  .option('-s, --secret <secret>'
    , 'secret (or $SECRET)'
    , String
    , process.env.SECRET)
  .option('-i, --ssid <ssid>'
    , 'session SSID (or $SSID)'
    , String
    , process.env.SSID || 'ssid')
  .option('-a, --app-url <url>'
    , 'URL to app'
    , String)
  .action(function(options) {
    if (!options.secret) {
      this.missingArgument('--secret')
    }
    if (!options.appUrl) {
      this.missingArgument('--app-url')
    }

    require('./roles/auth/mock')({
      port: options.port
    , secret: options.secret
    , ssid: options.ssid
    , appUrl: options.appUrl
    })
  })

program
  .command('notify-hipchat')
  .description('start HipChat notifier')
  .option('-t, --token <token>'
    , 'HipChat v2 API token (or $HIPCHAT_TOKEN)'
    , String
    , process.env.HIPCHAT_TOKEN)
  .option('-r, --room <room>'
    , 'HipChat room (or $HIPCHAT_ROOM)'
    , String
    , process.env.HIPCHAT_ROOM)
  .option('-p, --priority <level>'
    , 'minimum log level'
    , Number
    , logger.Level.WARNING)
  .option('-s, --connect-sub <endpoint>'
    , 'sub endpoint'
    , cliutil.list)
  .action(function(options) {
    if (!options.token) {
      this.missingArgument('--token')
    }
    if (!options.room) {
      this.missingArgument('--room')
    }
    if (!options.connectSub) {
      this.missingArgument('--connect-sub')
    }

    require('./roles/notify/hipchat')({
      token: options.token
    , room: options.room
    , priority: options.priority
    , endpoints: {
        sub: options.connectSub
      }
    })
  })

program
  .command('app')
  .description('start app')
  .option('-p, --port <port>'
    , 'port (or $PORT)'
    , Number
    , process.env.PORT || 7100)
  .option('-s, --secret <secret>'
    , 'secret (or $SECRET)'
    , String
    , process.env.SECRET)
  .option('-i, --ssid <ssid>'
    , 'session SSID (or $SSID)'
    , String
    , process.env.SSID || 'ssid')
  .option('-a, --auth-url <url>'
    , 'URL to auth client'
    , String)
  .option('-r, --storage-url <url>'
    , 'URL to storage client'
    , String)
  .option('-u, --connect-sub <endpoint>'
    , 'sub endpoint'
    , cliutil.list)
  .option('-c, --connect-push <endpoint>'
    , 'push endpoint'
    , cliutil.list)
  .option('-d, --disable-watch'
    , 'disable watching resources')
  .action(function(options) {
    if (!options.secret) {
      this.missingArgument('--secret')
    }
    if (!options.authUrl) {
      this.missingArgument('--auth-url')
    }
    if (!options.storageUrl) {
      this.missingArgument('--storage-url')
    }
    if (!options.connectSub) {
      this.missingArgument('--connect-sub')
    }
    if (!options.connectPush) {
      this.missingArgument('--connect-push')
    }

    require('./roles/app')({
      port: options.port
    , secret: options.secret
    , ssid: options.ssid
    , authUrl: options.authUrl
    , storageUrl: options.storageUrl
    , groupTimeout: 600 * 1000
    , endpoints: {
        sub: options.connectSub
      , push: options.connectPush
      }
    , disableWatch: options.disableWatch
    })
  })

program
  .command('storage-temp')
  .description('start temp storage')
  .option('-p, --port <port>'
    , 'port (or $PORT)'
    , Number
    , process.env.PORT || 7100)
  .option('--public-ip <ip>'
    , 'public ip for global access'
    , String
    , ip())
  .action(function(options) {
    require('./roles/storage/temp')({
      port: options.port
    , publicIp: options.publicIp
    })
  })

program
  .command('migrate')
  .description('migrates the database to the latest version')
  .action(function() {
    var log = logger.createLogger('cli:migrate')
      , db = require('./db')

    db.setup()
      .then(function() {
        process.exit(0)
      })
      .catch(function(err) {
        log.fatal('Migration had an error:', err.stack)
        process.exit(1)
      })
  })

program
  .command('local [serial..]')
  .description('start everything locally')
  .option('--bind-app-pub <endpoint>'
    , 'app pub endpoint'
    , String
    , 'tcp://127.0.0.1:7111')
  .option('--bind-app-dealer <endpoint>'
    , 'app dealer endpoint'
    , String
    , 'tcp://127.0.0.1:7112')
  .option('--bind-app-pull <endpoint>'
    , 'app pull endpoint'
    , String
    , 'tcp://127.0.0.1:7113')
  .option('--bind-dev-pub <endpoint>'
    , 'device pub endpoint'
    , String
    , 'tcp://127.0.0.1:7114')
  .option('--bind-dev-dealer <endpoint>'
    , 'device dealer endpoint'
    , String
    , 'tcp://127.0.0.1:7115')
  .option('--bind-dev-pull <endpoint>'
    , 'device pull endpoint'
    , String
    , 'tcp://127.0.0.1:7116')
  .option('--auth-port <port>'
    , 'auth port'
    , Number
    , 7120)
  .option('--auth-secret <secret>'
    , 'auth secret'
    , String
    , 'kute kittykat')
  .option('--app-port <port>'
    , 'app port'
    , Number
    , 7100)
  .option('--storage-port <port>'
    , 'storage port'
    , Number
    , 7102)
  .option('--provider <name>'
    , 'provider name (or os.hostname())'
    , String
    , os.hostname())
  .option('-d, --disable-watch'
    , 'disable watching resources')
  .action(function() {
    var log = logger.createLogger('cli:local')
      , options = cliutil.lastArg(arguments)

    // Each forked process waits for signals to stop, and so we run over the
    // default limit of 10. So, it's not a leak, but a refactor wouldn't hurt.
    process.setMaxListeners(20)

    function run() {
      var procs = [
        // app triproxy
        procutil.fork(__filename, [
            'triproxy', 'app001'
          , '--bind-pub', options.bindAppPub
          , '--bind-dealer', options.bindAppDealer
          , '--bind-pull', options.bindAppPull
          ])

        // device triproxy
      , procutil.fork(__filename, [
            'triproxy', 'dev001'
          , '--bind-pub', options.bindDevPub
          , '--bind-dealer', options.bindDevDealer
          , '--bind-pull', options.bindDevPull
          ])

        // processor one
      , procutil.fork(__filename, [
            'processor', 'proc001'
          , '--connect-app-dealer', options.bindAppDealer
          , '--connect-dev-dealer', options.bindDevDealer
          ])

        // processor two
      , procutil.fork(__filename, [
            'processor', 'proc002'
          , '--connect-app-dealer', options.bindAppDealer
          , '--connect-dev-dealer', options.bindDevDealer
          ])

        // reaper one
      , procutil.fork(__filename, [
            'reaper', 'reaper001'
          , '--connect-push', options.bindDevPull
          ])

        // provider
      , procutil.fork(__filename, [
            'provider'
          , '--name', options.provider
          , '--connect-sub', options.bindDevPub
          , '--connect-push', options.bindDevPull
          ].concat(cliutil.allUnknownArgs(arguments)))

        // auth-mock
      , procutil.fork(__filename, [
            'auth-mock'
          , '--port', options.authPort
          , '--secret', options.authSecret
          , '--app-url', util.format('http://localhost:%d/', options.appPort)
          ])

        // app
      , procutil.fork(__filename, [
            'app'
          , '--port', options.appPort
          , '--secret', options.authSecret
          , '--auth-url', util.format('http://localhost:%d/', options.authPort)
          , '--storage-url'
          , util.format('http://localhost:%d/', options.storagePort)
          , '--connect-sub', options.bindAppPub
          , '--connect-push', options.bindAppPull
          ].concat((function() {
            var extra = []
            if (options.disableWatch) {
              extra.push('--disable-watch')
            }
            return extra
          })()))

        // storage
      , procutil.fork(__filename, [
            'storage-temp'
          , '--port', options.storagePort
          ])
      ]

      function shutdown() {
        log.info('Shutting down all child processes')
        procs.forEach(function(proc) {
          proc.cancel()
        })
        return Promise.settle(procs)
      }

      process.on('SIGINT', function() {
        log.info('Received SIGINT, waiting for processes to terminate')
      })

      process.on('SIGTERM', function() {
        log.info('Received SIGTERM, waiting for processes to terminate')
      })

      return Promise.all(procs)
        .then(function() {
          process.exit(0)
        })
        .catch(function(err) {
          log.fatal('Child process had an error', err.stack)
          return shutdown()
            .then(function() {
              process.exit(1)
            })
        })
    }

    procutil.fork(__filename, ['migrate'])
      .then(run)
  })

program.parse(process.argv)
