var chalk = require('chalk')
/* eslint no-console:0 */

// http://stackoverflow.com/questions/7157999/output-jasmine-test-results-to-the-console
// https://github.com/pivotal/jasmine/blob/master/src/console/ConsoleReporter.js

module.exports = function BrowserLogs(opts) {
  var options = opts || {}

  if (typeof options.expectNoLogs === 'undefined') {
    options.expectNoLogs = false
  }
  if (typeof options.outputLogs === 'undefined') {
    options.outputLogs = true
  }

  browser.getCapabilities().then(function(cap) {
    var browserName = ' ' + cap.caps_.browserName + ' log '
    var browserStyled = chalk.bgBlue.white.bold(browserName) + ' '

    browser.manage().logs().get('browser').then(function(browserLogs) {
      if (options.expectNoLogs) {
        expect(browserLogs.length).toEqual(0)
      }

      if (options.outputLogs && browserLogs.length) {
        browserLogs.forEach(function(log) {
          if (log.level.value > 900) {
            console.error(browserStyled + chalk.white.bold(log.message))
          } else {
            console.log(browserStyled + chalk.white.bold(log.message))
          }
        })
      }
    })
  })
}
