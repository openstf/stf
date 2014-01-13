var program = require('commander')

var pkg = require('../package')
var cliargs = require('./util/cliargs')

program
  .version(pkg.version)

program
  .command('provider [serial..]')
  .description('start provider')
  .option('-s, --connect-dev-sub <endpoint>', 'device sub endpoint',
    cliargs.list)
  .option('-p, --connect-dev-push <endpoint>', 'device push endpoint',
    cliargs.list)
  .action(function() {
    var serials = cliargs.allUnknownArgs(arguments)
      , options = cliargs.lastArg(arguments)

    if (!options.connectDevSub) {
      this.missingArgument('--connect-dev-sub')
    }
    if (!options.connectDevPush) {
      this.missingArgument('--connect-dev-push')
    }

    require('./roles/provider')({
      filter: function(device) {
        return serials.length === 0 || serials.indexOf(device.id) !== -1
      }
    , fork: function(device) {
        var fork = require('child_process').fork
        return fork(__filename, [
          'device', device.id
        , '--connect-sub', options.connectDevSub.join(',')
        , '--connect-push', options.connectDevPush.join(',')
        ])
      }
    })
  })

program
  .command('device <serial>')
  .description('start device worker')
  .option('-s, --connect-sub <endpoint>', 'sub endpoint', cliargs.list)
  .option('-p, --connect-push <endpoint>', 'push endpoint', cliargs.list)
  .action(function(serial, options) {
    if (!options.connectSub) {
      this.missingArgument('--connect-sub')
    }
    if (!options.connectPush) {
      this.missingArgument('--connect-push')
    }

    require('./roles/device')({
      serial: serial
    , endpoints: {
        sub: options.connectSub
      , push: options.connectPush
      }
    })
  })

program
  .command('coordinator <name>')
  .description('start coordinator')
  .option('-a, --connect-app-dealer <endpoint>', 'app dealer endpoint',
    cliargs.list)
  .option('-d, --connect-dev-dealer <endpoint>', 'device dealer endpoint',
    cliargs.list)
  .action(function(name, options) {
    if (!options.connectAppDealer) {
      this.missingArgument('--connect-app-dealer')
    }
    if (!options.connectDevDealer) {
      this.missingArgument('--connect-dev-dealer')
    }

    require('./roles/coordinator')({
      name: name
    , endpoints: {
        appDealer: options.connectAppDealer
      , devDealer: options.connectDevDealer
      }
    })
  })

program
  .command('triproxy <name>')
  .description('start triproxy')
  .option('-u, --bind-pub <endpoint>', 'pub endpoint',
    String, 'tcp://*:7111')
  .option('-d, --bind-dealer <endpoint>', 'dealer endpoint',
    String, 'tcp://*:7112')
  .option('-p, --bind-pull <endpoint>', 'pull endpoint',
    String, 'tcp://*:7113')
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
  .command('local [serial..]')
  .description('start everything locally')
  .option('--bind-app-pub <endpoint>', 'app pub endpoint',
    String, 'tcp://127.0.0.1:7111')
  .option('--bind-app-dealer <endpoint>', 'app dealer endpoint',
    String, 'tcp://127.0.0.1:7112')
  .option('--bind-app-pull <endpoint>', 'app pull endpoint',
    String, 'tcp://127.0.0.1:7113')
  .option('--bind-dev-pub <endpoint>', 'device pub endpoint',
    String, 'tcp://127.0.0.1:7114')
  .option('--bind-dev-dealer <endpoint>', 'device dealer endpoint',
    String, 'tcp://127.0.0.1:7115')
  .option('--bind-dev-pull <endpoint>', 'device pull endpoint',
    String, 'tcp://127.0.0.1:7116')
  .action(function() {
    var options = cliargs.lastArg(arguments)
      , fork = require('child_process').fork

    // app triproxy
    fork(__filename, [
      'triproxy', 'app001'
    , '--bind-pub', options.bindAppPub
    , '--bind-dealer', options.bindAppDealer
    , '--bind-pull', options.bindAppPull
    ])

    // device triproxy
    fork(__filename, [
      'triproxy', 'dev001'
    , '--bind-pub', options.bindDevPub
    , '--bind-dealer', options.bindDevDealer
    , '--bind-pull', options.bindDevPull
    ])

    // coordinator one
    fork(__filename, [
      'coordinator', 'coord001'
    , '--connect-app-dealer', options.bindAppDealer
    , '--connect-dev-dealer', options.bindDevDealer
    ])

    // coordinator two
    fork(__filename, [
      'coordinator', 'coord002'
    , '--connect-app-dealer', options.bindAppDealer
    , '--connect-dev-dealer', options.bindDevDealer
    ])

    // provider
    fork(__filename, [
      'provider'
    , '--connect-dev-sub', options.bindDevPub
    , '--connect-dev-push', options.bindDevPull
    ].concat(cliargs.allUnknownArgs(arguments)))
  })

program.parse(process.argv)
