var pathutil = require('./lib/util/pathutil')
var webpack = require('webpack')
var CommonsChunkPlugin = require("webpack/lib/optimize/CommonsChunkPlugin")

module.exports = {
  webpack: {
    cache: true,
    entry: {
      app: pathutil.resource('app/app.js'),
      authldap: pathutil.resource('auth/ldap/scripts/entry.js'),
      authmock: pathutil.resource('auth/mock/scripts/entry.js')
    },
    output: {
      path: pathutil.resource('build'),
      publicPath: '/static/app/build/',
      filename: 'entry/[name].entry.js',
      chunkFilename: '[id].[hash].chunk.js'
    },
    stats: {
      colors: true
    },
    resolve: {
      modulesDirectories: [
        pathutil.resource('app/components')
        , pathutil.resource('web_modules')
        , pathutil.resource('bower_components')
        , './node_modules'
      ],
      alias: {
        'angular-bootstrap': 'angular-bootstrap/ui-bootstrap-tpls',
        'localforage': 'localforage/dist/localforage.js',
        'socket.io': 'socket.io-client',
        'oboe': 'oboe/dist/oboe-browser'
      }
    },
    module: {
      loaders: [
        { test: /\.css$/, loader: 'style!css' },
        { test: /\.less$/, loader: 'style-loader!css-loader!less-loader'},
        { test: /\.json$/, loader: 'json' },
        { test: /\.jpg$/, loader: "url-loader?limit=1000&mimetype=image/jpeg" },
        { test: /\.png$/, loader: "url-loader?limit=1000&mimetype=image/png" },
        { test: /\.gif$/, loader: "url-loader?limit=1000&mimetype=image/gif" },
        { test: /\.svg$/, loader: "url-loader?limit=1&mimetype=image/svg+xml" },
        { test: /\.woff$/, loader: "url-loader?limit=1&mimetype=application/font-woff" },
        { test: /\.otf$/, loader: "url-loader?limit=1&mimetype=application/font-woff" },
        { test: /\.ttf$/, loader: "url-loader?limit=1&mimetype=application/font-woff" },
        { test: /\.eot$/, loader: "url-loader?limit=1&mimetype=vnd.ms-fontobject" },
        { test: /\.jade$/, loader: 'template-html-loader' },
        { test: /\.html$/, loader: 'html-loader' },
        { test: /angular\.js$/, loader: 'exports?angular'},
        { test: /angular-route\.js$/, loader: 'imports?angular=angular'},
        { test: /angular-touch\.js$/, loader: 'imports?angular=angular'},
        { test: /angular-animate\.js$/, loader: 'imports?angular=angular'},
        { test: /angular-growl\.js$/, loader: 'imports?angular=angular'},
        { test: /oboe-browser\.js$/, loader: 'imports?define=>false!exports?oboe'},
        { test: /uuid\.js$/, loader: 'imports?require=>undefined'},
        //{ test: /ui-bootstrap-tpls\.js$/, loader: 'script'},
        { test: /dialogs\.js$/, loader: 'script'}
      ],
      preLoaders: [
        {
          test: /\.js$/,
          exclude: /node_modules|bower_components/,
          loader: 'jshint-loader'
        }
      ],
      noParse: [
        //pathutil.resource('bower_components')
      ]
    },
    plugins: [
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
      , new CommonsChunkPlugin("entry/commons.entry.js")
    ]
  },
  webpackServer: {
    debug: true,
    devtool: 'eval',
    stats: {
      colors: true
    }
  }
}
