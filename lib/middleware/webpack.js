var webpackMiddleware = require('webpack-dev-middleware')
var webpack = require('webpack')
var _ = require('lodash')

var webpackOptions = require('../../webpack.config.js')

var overrideOptions = {
  debug: true,
  devtool: 'eval'
}

var finalOptions = _.assign(webpackOptions, overrideOptions)

module.exports = webpackMiddleware(webpack(finalOptions), {
  noInfo: false,
  quiet: false,
  lazy: false,
  publicPath: '/static/build/',
  stats: {
    colors: true
  }
})
