var _ = require('lodash')

var webpack = require('webpack')
var CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin')
var ProgressPlugin = require('webpack/lib/ProgressPlugin')

var pathutil = require('./lib/util/pathutil')
var log = require('./lib/util/logger').createLogger('webpack:config')

module.exports = {
  webpack: {
    context: __dirname
    , cache: true
    , entry: {
      app: pathutil.resource('app/app.js')
      , authldap: pathutil.resource('auth/ldap/scripts/entry.js')
      , authmock: pathutil.resource('auth/mock/scripts/entry.js')
    }
    , output: {
      path: pathutil.resource('build')
      , publicPath: '/static/app/build/'
      , filename: 'entry/[name].entry.js'
      , chunkFilename: '[id].[hash].chunk.js'
    }
    , stats: {
      colors: true
    }
    , resolve: {
      root: [
        pathutil.resource('app/components')
      ]
      , modulesDirectories: [
        'web_modules'
        , 'bower_components'
        , 'node_modules'
      ]
      , alias: {
        'angular-bootstrap': 'angular-bootstrap/ui-bootstrap-tpls'
        , localforage: 'localforage/dist/localforage.js'
        , 'socket.io': 'socket.io-client'
        , stats: 'stats.js/src/Stats.js'
        , 'underscore.string': 'underscore.string/index'
      }
    }
    , module: {
      loaders: [
        {test: /\.css$/, loader: 'style!css'}
        , {test: /\.scss$/, loader: 'style!css!sass'}
        , {test: /\.less$/, loader: 'style!css!less'}
        , {test: /\.json$/, loader: 'json'}
        , {test: /\.jpg$/, loader: 'url?limit=1000&mimetype=image/jpeg'}
        , {test: /\.png$/, loader: 'url?limit=1000&mimetype=image/png'}
        , {test: /\.gif$/, loader: 'url?limit=1000&mimetype=image/gif'}
        , {test: /\.svg/, loader: 'url?limit=1&mimetype=image/svg+xml'}
        , {test: /\.woff/, loader: 'url?limit=1&mimetype=application/font-woff'}
        , {test: /\.otf/, loader: 'url?limit=1&mimetype=application/font-woff'}
        , {test: /\.ttf/, loader: 'url?limit=1&mimetype=application/font-woff'}
        , {test: /\.eot/, loader: 'url?limit=1&mimetype=vnd.ms-fontobject'}
        , {test: /\.jade$/, loader: 'template-html-loader'}
        , {test: /\.html$/, loader: 'html-loader'}
        , {test: /angular\.js$/, loader: 'exports?angular'}
        , {test: /angular-cookies\.js$/, loader: 'imports?angular=angular'}
        , {test: /angular-route\.js$/, loader: 'imports?angular=angular'}
        , {test: /angular-touch\.js$/, loader: 'imports?angular=angular'}
        , {test: /angular-animate\.js$/, loader: 'imports?angular=angular'}
        , {test: /angular-growl\.js$/, loader: 'imports?angular=angular'}
        , {test: /uuid\.js$/, loader: 'imports?require=>undefined'}
        , {test: /dialogs\.js$/, loader: 'script'}
      ]
      // TODO: enable when its sane
      // preLoaders: [
      //  {
      //    test: /\.js$/,
      //    exclude: /node_modules|bower_components/,
      //    loader: 'eslint-loader'
      //  }
      // ],
      , noParse: [
        // pathutil.resource('bower_components')
      ]
    }
    , plugins: [
      new webpack.ResolverPlugin(
        new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin(
          'bower.json'
          , ['main']
        )
      )
      , new webpack.ResolverPlugin(
        new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin(
          '.bower.json'
          , ['main']
        )
      )
      , new CommonsChunkPlugin('entry/commons.entry.js')
      , new ProgressPlugin(_.throttle(
        function(progress, message) {
          var msg
          if (message) {
            msg = message
          }
          else {
            msg = progress >= 1 ? 'complete' : 'unknown'
          }
          log.info('Build progress %d%% (%s)', Math.floor(progress * 100), msg)
        }
        , 1000
      ))
    ]
  }
  , webpackServer: {
    debug: true
    , devtool: 'eval'
    , stats: {
      colors: true
    }
  }
}
