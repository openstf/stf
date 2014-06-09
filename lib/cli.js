var util = require('util')
var os = require('os')

var program = require('commander')
var Promise = require('bluebird')
var ip = require('my-local-ip')

var pkg = require('../package')
var cliutil = require('./util/cliutil')
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
    , 'maximum port number for worker use'
    , Number
    , 7700)
  .option('--public-ip <ip>'
    , 'public ip for global access'
    , String
    , ip())
  .option('-t, --group-timeout <seconds>'
    , 'group timeout'
    , Number
    , 600)
  .option('-r, --storage-url <url>'
    , 'URL to storage client'
    , String)
  .option('--heartbeat-interval <ms>'
    , 'heartbeat interval'
    , Number
    , 10000)
  .option('--adb-host <host>'
    , 'ADB host (defaults to 127.0.0.1)'
    , String
    , '127.0.0.1')
  .option('--adb-port <port>'
    , 'ADB port (defaults to 5037)'
    , Number
    , 5037)
  .action(function() {
    var serials = cliutil.allUnknownArgs(arguments)
      , options = cliutil.lastArg(arguments)

    if (!options.connectSub) {
      this.missingArgument('--connect-sub')
    }
    if (!options.connectPush) {
      this.missingArgument('--connect-push')
    }
    if (!options.storageUrl) {
      this.missingArgument('--storage-url')
    }

    require('./roles/provider')({
      name: options.name
    , killTimeout: 10000
    , heartbeatInterval: options.heartbeatInterval
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
        , '--group-timeout', options.groupTimeout
        , '--storage-url', options.storageUrl
        , '--adb-host', options.adbHost
        , '--adb-port', options.adbPort
        ])
      }
    , endpoints: {
        sub: options.connectSub
      , push: options.connectPush
      }
    , adbHost: options.adbHost
    , adbPort: options.adbPort
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
  .option('-t, --group-timeout <seconds>'
    , 'group timeout'
    , Number
    , 600)
  .option('-r, --storage-url <url>'
    , 'URL to storage client'
    , String)
  .option('--adb-host <host>'
    , 'ADB host (defaults to 127.0.0.1)'
    , String
    , '127.0.0.1')
  .option('--adb-port <port>'
    , 'ADB port (defaults to 5037)'
    , Number
    , 5037)
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
    if (!options.storageUrl) {
      this.missingArgument('--storage-url')
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
    , groupTimeout: options.groupTimeout * 1000 // change to ms
    , storageUrl: options.storageUrl
    , adbHost: options.adbHost
    , adbPort: options.adbPort
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
    , logger.Level.IMPORTANT)
  .option('-n, --notify-priority <level>'
    , 'minimum log level to cause a notification'
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
    , notifyPriority: options.notifyPriority
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
  .option('-w, --websocket-url <url>'
    , 'URL to websocket client'
    , String)
  .option('-r, --storage-url <url>'
    , 'URL to storage client'
    , String)
  .option('--storage-plugin-image-url <url>'
    , 'URL to image storage plugin'
    , String)
  .option('--storage-plugin-apk-url <url>'
    , 'URL to apk storage plugin'
    , String)
  .option('-d, --disable-watch'
    , 'disable watching resources')
  .action(function(options) {
    if (!options.secret) {
      this.missingArgument('--secret')
    }
    if (!options.authUrl) {
      this.missingArgument('--auth-url')
    }
    if (!options.websocketUrl) {
      this.missingArgument('--websocket-url')
    }
    if (!options.storageUrl) {
      this.missingArgument('--storage-url')
    }
    if (!options.storagePluginImageUrl) {
      this.missingArgument('--storage-plugin-image-url')
    }
    if (!options.storagePluginApkUrl) {
      this.missingArgument('--storage-plugin-apk-url')
    }

    require('./roles/app')({
      port: options.port
    , secret: options.secret
    , ssid: options.ssid
    , authUrl: options.authUrl
    , websocketUrl: options.websocketUrl
    , storageUrl: options.storageUrl
    , storagePluginImageUrl: options.storagePluginImageUrl
    , storagePluginApkUrl: options.storagePluginApkUrl
    , disableWatch: options.disableWatch
    })
  })

program
  .command('websocket')
  .description('start websocket')
  .option('-p, --port <port>'
    , 'port (or $PORT)'
    , Number
    , process.env.PORT || 7110)
  .option('-s, --secret <secret>'
    , 'secret (or $SECRET)'
    , String
    , process.env.SECRET)
  .option('-i, --ssid <ssid>'
    , 'session SSID (or $SSID)'
    , String
    , process.env.SSID || 'ssid')
  .option('-r, --storage-url <url>'
    , 'URL to storage client'
    , String)
  .option('-u, --connect-sub <endpoint>'
    , 'sub endpoint'
    , cliutil.list)
  .option('-c, --connect-push <endpoint>'
    , 'push endpoint'
    , cliutil.list)
  .action(function(options) {
    if (!options.secret) {
      this.missingArgument('--secret')
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

    require('./roles/websocket')({
      port: options.port
    , secret: options.secret
    , ssid: options.ssid
    , storageUrl: options.storageUrl
    , endpoints: {
        sub: options.connectSub
      , push: options.connectPush
      }
    })
  })

program
  .command('storage-temp')
  .description('start temp storage')
  .option('-p, --port <port>'
    , 'port (or $PORT)'
    , Number
    , process.env.PORT || 7100)
  .option('--save-dir <dir>'
    , 'where to save files'
    , String
    , os.tmpdir())
  .action(function(options) {
    require('./roles/storage/temp')({
      port: options.port
    , saveDir: options.saveDir
    })
  })

program
  .command('storage-plugin-image')
  .description('start storage image plugin')
  .option('-p, --port <port>'
    , 'port (or $PORT)'
    , Number
    , process.env.PORT || 7100)
  .option('-r, --storage-url <url>'
    , 'URL to storage client'
    , String)
  .option('-c, --concurrency <num>'
    , 'maximum number of simultaneous transformations'
    , Number)
  .option('--cache-dir <dir>'
    , 'where to cache images'
    , String
    , os.tmpdir())
  .action(function(options) {
    if (!options.storageUrl) {
      this.missingArgument('--storage-url')
    }

    require('./roles/storage/plugins/image')({
      port: options.port
    , storageUrl: options.storageUrl
    , cacheDir: options.cacheDir
    , concurrency: options.concurrency || os.cpus().length
    })
  })

program
  .command('storage-plugin-apk')
  .description('start storage apk plugin')
  .option('-p, --port <port>'
    , 'port (or $PORT)'
    , Number
    , process.env.PORT || 7100)
  .option('-r, --storage-url <url>'
    , 'URL to storage client'
    , String)
  .option('--cache-dir <dir>'
    , 'where to cache images'
    , String
    , os.tmpdir())
  .action(function(options) {
    if (!options.storageUrl) {
      this.missingArgument('--storage-url')
    }

    require('./roles/storage/plugins/apk')({
      port: options.port
    , storageUrl: options.storageUrl
    , cacheDir: options.cacheDir
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
  .command('generate-fake-device')
  .description('generates a fake device for testing')
  .option('-n, --number <n>'
    , 'how many devices to create (defaults to 1)'
    , Number
    , 1)
  .action(function(options) {
    var log = logger.createLogger('cli:generate-fake-device')
      , fake = require('./util/fakedevice')
      , n = options.number

    function next() {
      return fake.generate()
        .then(function(serial) {
          log.info('Created fake device "%s"', serial)

          if (--n) {
            return next()
          }
        })
    }

    next()
      .then(function() {
        process.exit(0)
      })
      .catch(function(err) {
        log.fatal('Fake device creation had an error:', err.stack)
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
  .option('--websocket-port <port>'
    , 'websocket port'
    , Number
    , 7110)
  .option('--storage-port <port>'
    , 'storage port'
    , Number
    , 7102)
  .option('--storage-plugin-image-port <port>'
    , 'storage image plugin port'
    , Number
    , 7103)
  .option('--storage-plugin-apk-port <port>'
    , 'storage apk plugin port'
    , Number
    , 7104)
  .option('--provider <name>'
    , 'provider name (or os.hostname())'
    , String
    , os.hostname())
  .option('-d, --disable-watch'
    , 'disable watching resources')
  .option('-t, --group-timeout <seconds>'
    , 'group timeout'
    , Number
    , 600)
  .option('--public-ip <ip>'
    , 'public ip for global access'
    , String
    , 'localhost')
  .option('--adb-host <host>'
    , 'ADB host (defaults to 127.0.0.1)'
    , String
    , '127.0.0.1')
  .option('--adb-port <port>'
    , 'ADB port (defaults to 5037)'
    , Number
    , 5037)
  .action(function() {
    var log = logger.createLogger('cli:local')
      , args = arguments
      , options = cliutil.lastArg(args)
      , procutil = require('./util/procutil')

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
          , '--group-timeout', options.groupTimeout
          , '--public-ip', options.publicIp
          , '--storage-url'
          , util.format('http://localhost:%d/', options.storagePort)
          , '--adb-host', options.adbHost
          , '--adb-port', options.adbPort
          ].concat(cliutil.allUnknownArgs(args)))

        // auth-mock
      , procutil.fork(__filename, [
            'auth-mock'
          , '--port', options.authPort
          , '--secret', options.authSecret
          , '--app-url', util.format(
              'http://%s:%d/'
            , options.publicIp
            , options.appPort
            )
          ])

        // app
      , procutil.fork(__filename, [
            'app'
          , '--port', options.appPort
          , '--secret', options.authSecret
          , '--auth-url', util.format(
              'http://%s:%d/'
            , options.publicIp
            , options.authPort
            )
          , '--websocket-url', util.format(
              'http://%s:%d/'
            , options.publicIp
            , options.websocketPort
            )
          , '--storage-url'
          , util.format('http://localhost:%d/', options.storagePort)
          , '--storage-plugin-image-url'
          , util.format('http://localhost:%d/', options.storagePluginImagePort)
          , '--storage-plugin-apk-url'
          , util.format('http://localhost:%d/', options.storagePluginApkPort)
          ].concat((function() {
            var extra = []
            if (options.disableWatch) {
              extra.push('--disable-watch')
            }
            return extra
          })()))

        // websocket
      , procutil.fork(__filename, [
            'websocket'
          , '--port', options.websocketPort
          , '--secret', options.authSecret
          , '--storage-url'
          , util.format('http://localhost:%d/', options.storagePort)
          , '--connect-sub', options.bindAppPub
          , '--connect-push', options.bindAppPull
          ])

        // storage
      , procutil.fork(__filename, [
            'storage-temp'
          , '--port', options.storagePort
          ])

        // image processor
      , procutil.fork(__filename, [
            'storage-plugin-image'
          , '--port', options.storagePluginImagePort
          , '--storage-url'
          , util.format('http://localhost:%d/', options.storagePort)
          ])

        // apk processor
      , procutil.fork(__filename, [
            'storage-plugin-apk'
          , '--port', options.storagePluginApkPort
          , '--storage-url'
          , util.format('http://localhost:%d/', options.storagePort)
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
      .done(run)
  })

program.parse(process.argv)
