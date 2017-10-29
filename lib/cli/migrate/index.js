module.exports.command = 'migrate'

module.exports.describe = 'Migrates the database to the latest version.'

module.exports.builder = function(yargs) {
  return yargs
}

module.exports.handler = function() {
  var logger = require('../../util/logger')
  var log = logger.createLogger('cli:migrate')
  var db = require('../../db')

  return db.setup()
    .then(function() {
      process.exit(0)
    })
    .catch(function(err) {
      log.fatal('Migration had an error:', err.stack)
      process.exit(1)
    })
}
