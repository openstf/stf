var util = require('util')

var syrup = require('syrup')

var logger = require('../../../util/logger')

module.exports = syrup()
  .dependency(require('../support/http'))
  .dependency(require('./input'))
  .define(function(options, http, input) {
    var log = logger.createLogger('device:plugins:browsers')

    log.info('Fetching browser list')
    return input.getBrowsers()
      .then(function(browsers) {
        var icons = Object.create(null)

        browsers.apps.forEach(function(app) {
          icons[app.component] = app.icon.toBuffer()
          app.icon = util.format(
            '%s/api/v1/browsers/%s/icon'
          , http.get('public url')
          , app.component
          )
        })

        http.get(
          '/api/v1/browsers/:package/:activity/icon'
        , function(req, res) {
            var component = util.format(
              '%s/%s'
            , req.params.package
            , req.params.activity
            )

            var icon = icons[component]

            if (icon) {
              res.set('Content-Type', 'image/png')
              res.set('Content-Length', icon.length)
              res.send(200, icon)
            }
            else {
              res.send(404)
            }
          }
        )

        return browsers
      })
  })
