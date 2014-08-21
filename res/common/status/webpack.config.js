var pathutil = require('./../../../lib/util/pathutil')
var options = require('./../../../webpack.config').webpack
var _ = require('lodash')

module.exports = _.defaults(options, {
  entry: pathutil.resource('common/status/scripts/entry.js'),
  output: {
    path: pathutil.resource('build'),
    publicPath: '/static/build/',
    filename: 'bundle-status.js'
  }
})
