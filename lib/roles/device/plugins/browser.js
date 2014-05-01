var syrup = require('syrup')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

module.exports = syrup.serial()
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .dependency(require('../support/adb'))
  .dependency(require('./service'))
  .define(function(options, router, push, adb, service) {
    var log = logger.createLogger('device:plugins:browsers')

    function pkg(component) {
      return component.split('/', 1)[0]
    }

    log.info('Fetching browser list')
    return service.getBrowsers()
      .timeout(15000)
      .then(function(browsers) {
        browsers.apps.forEach(function(app) {
          switch (pkg(app.component)) {
            case 'com.android.chrome':
              app.type = 'chrome'
              break
            case 'com.chrome.beta':
              app.type = 'chrome-beta'
              break
            case 'com.sec.android.app.sbrowser':
              app.type = 'samsung-chrome'
              break
            case 'com.android.browser':
              app.type = 'android'
              break
            case 'org.mozilla.firefox':
              app.type = 'firefox'
              break
            case 'org.mozilla.firefox_beta':
              app.type = 'firefox-beta'
              break
            case 'com.opera.browser':
              app.type = 'opera'
              break
            case 'com.opera.mini.android':
              app.type = 'opera-mini'
              break
            case 'com.opera.browser.beta':
              app.type = 'opera-beta'
              break
            case 'com.UCMobile.intl':
              app.type = 'uc'
              break
            case 'com.explore.web.browser':
              app.type = 'lightning'
              break
            case 'com.baidu.browser.inter':
              app.type = 'baidu'
              break
            case 'com.tencent.ibibo.mtt':
              app.type = 'one'
              break
            default:
              app.type = app.name.toLowerCase()
                .replace(/\s+/g, '-')
          }

          app.id = app.component

          delete app.icon
          delete app.component
        })

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

        return browsers
      })
  })
