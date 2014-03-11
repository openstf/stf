var webpackMiddleware = require('webpack-dev-middleware')
var webpack = require('webpack')

var pathutil = require('../util/pathutil')

var webpackOptions = {
  cache: true,
  debug: true,
  devtool: 'eval',
  entry: pathutil.resource('app') + '/app.js',
  output: {
    path: '/static/build/',
    filename: 'bundle.js'
  },
  resolve: {
    modulesDirectories: [
      pathutil.resource('bower_components'),
        pathutil.resource('app') + '/components',
      'web_modules',
      './../../node_modules'
    ],
    alias: {
      'socket.io': 'socket.io-client/dist/socket.io',
      'oboe': 'oboe/dist/oboe-browser'
    }
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style!css' },
      { test: /\.jpg$/, loader: "url-loader?prefix=static/&limit=10000&minetype=image/jpeg" },
      { test: /\.png$/, loader: "url-loader?prefix=static/&limit=10000&minetype=image/png" },
      { test: /\.gif$/, loader: "url-loader?prefix=static/&limit=10000&minetype=image/gif" },
      { test: /\.svg/, loader: "url-loader?prefix=static/&limit=10000&minetype=image/svg+xml" },
      { test: /\.woff$/, loader: "url-loader?prefix=static/&limit=10000&minetype=font-woff" },
      { test: /\.otf$/, loader: "url-loader?prefix=static/&limit=10000&minetype=octet-stream" },
      { test: /\.ttf$/, loader: "url-loader?prefix=static/&limit=10000&minetype=octet-stream" },
      { test: /\.eot$/, loader: "url-loader?prefix=static/&limit=10000&minetype=vnd.ms-fontobject" },
      { test: /\.jade/, loader: 'template-html-loader' },
      { test: /\.html/, loader: 'html-loader' },
      { test: /angular\.js/, loader: 'exports?angular'},
      { test: /angular-route\.js/, loader: 'imports?angular=angular'},
      { test: /oboe-browser\.js/, loader: 'imports?define=>false!exports?oboe'}
    ],
    noParse: [
      //  pathutil.resource('bower_components')
    ]
  },
  plugins: [
    new webpack.ResolverPlugin(
      new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin('bower.json', ['main'])
    ),
    new webpack.ResolverPlugin(
      new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin('.bower.json', ['main'])
    )
//    ,new webpack.optimize.UglifyJsPlugin({mangle: false})
  ]
}

module.exports = webpackMiddleware(webpack(webpackOptions), {
  noInfo: false,
  quiet: false,
  lazy: false,
  publicPath: '/static/build/',
  stats: {
    colors: true
  }
})
