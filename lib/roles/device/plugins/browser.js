var util = require('util')

var syrup = require('syrup')

var browsers = require('stf-browser-db')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

var mapping = (function() {
  var list = Object.create(null)
  Object.keys(browsers).forEach(function(id) {
    var browser = browsers[id]
    if (browser.platforms.android) {
      list[browser.platforms.android.package] = id
    }
  })
  return list
})()

module.exports = syrup.serial()
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .dependency(require('../support/adb'))
  .dependency(require('./service'))
  .define(function(options, router, push, adb, service) {
    var log = logger.createLogger('device:plugins:browser')

    function pkg(component) {
      return component.split('/', 1)[0]
    }

    function processApp(app) {
      var packageName = pkg(app.component)
      var browserId = mapping[packageName]

      if (!browserId) {
        throw new Error(util.format('Unmapped browser "%s"', packageName))
      }

      return {
        id: app.component
      , type: browserId
      , name: browsers[browserId].name
      , selected: app.selected
      , system: app.system
      }
    }

    function updateBrowsers(data) {
      log.info('Updating browser list')
      push.send([
        wireutil.global
      , wireutil.envelope(new wire.DeviceBrowserMessage(
          options.serial
        , data.selected
        , data.apps.map(function(app) {
            return new wire.DeviceBrowserAppMessage(processApp(app))
          })
        ))
      ])
    }

    function loadBrowsers() {
      log.info('Loading browser list')
      return service.getBrowsers()
        .then(updateBrowsers)
    }

    service.on('browserPackageChange', updateBrowsers)

    router.on(wire.BrowserOpenMessage, function(channel, message) {
      if (message.browser) {
        log.info('Opening "%s" in "%s"', message.url, message.browser)
      }
      else {
        log.info('Opening "%s"', message.url)
      }

      var reply = wireutil.reply(options.serial)
      adb.startActivity(options.serial, {
          action: 'android.intent.action.VIEW'
        , component: message.browser
        , data: message.url
        })
        .then(function() {
          push.send([
            channel
          , reply.okay()
          ])
        })
        .catch(function(err) {
          log.error('Browser could not be opened', err.stack)
          push.send([
            channel
          , reply.fail()
          ])
        })
    })

    router.on(wire.BrowserClearMessage, function(channel, message) {
      log.info('Clearing "%s"', message.browser)
      var reply = wireutil.reply(options.serial)
      adb.clear(options.serial, pkg(message.browser))
        .then(function() {
          push.send([
            channel
          , reply.okay()
          ])
        })
        .catch(function(err) {
          log.error('Browser could not be cleared', err.stack)
          push.send([
            channel
          , reply.fail()
          ])
        })
    })

    return loadBrowsers()
  })
