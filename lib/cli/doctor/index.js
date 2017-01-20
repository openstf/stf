module.exports.command = 'doctor'

module.exports.describe = 'Diagnose potential issues with your installation.'

module.exports.builder = function(yargs) {
  return yargs
}

module.exports.handler = function() {
  return require('../../util/doctor').run()
}
