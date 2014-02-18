var webpackMiddleware = require('webpack-dev-middleware')
var webpack = require('webpack')

var pathutil = require('../util/pathutil')

module.exports = webpackMiddleware(webpack({
  cache: true,
  debug: true,
//  devtool: 'eval-source-map',
  devtool: 'eval',
  entry: pathutil.resource('app') + '/app.js',
  output: {
    path: '/static/build/',
    filename: 'bundle.js'
  },
  resolve: {
    modulesDirectories: [pathutil.resource('lib'), 'web_modules', './../../node_modules'],
    alias: {
      'socket.io': 'socket.io-client/dist/socket.io'
    }
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style!css' },
      { test: /\.jade/, loader: 'template-html-loader' },
      { test: /angular\.js/, loader: 'exports?angular'},
      { test: /angular-route\.js/, loader: 'imports?angular=angular'}
    ],
    noParse: [
      pathutil.resource('lib')
    ]
  },
  plugins: [
    new webpack.ResolverPlugin(
      new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin('bower.json', ['main'])
    ),
    new webpack.ResolverPlugin(
      new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin('.bower.json', ['main'])
    )
    //new webpack.optimize.UglifyJsPlugin()
  ]
}), {
  noInfo: false,
  quiet: false,
  lazy: false,
  publicPath: '/static/build/',
  stats: {
    colors: true
  }
})
