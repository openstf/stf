var program = require('commander')

var pkg = require('../package')

program
  .version(pkg.version)

program
  .command('provider')
  .description('run STF provider')
  .action(function() {
    require('./provider')
  })

program.parse(process.argv)
