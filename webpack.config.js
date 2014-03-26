var pathutil = require('./lib/util/pathutil')
var webpack = require('webpack')

module.exports = {
  cache: true
, entry: pathutil.resource('app/app.js')
, output: {
    path: pathutil.resource('build')
  , publicPath: '/static/build/'
  , filename: 'bundle.js'
  }
, resolve: {
    modulesDirectories: [
      pathutil.resource('bower_components')
    , pathutil.resource('app/components')
    , 'web_modules'
    , './node_modules'
    ]
  , alias: {
      'angular-bootstrap': 'angular-bootstrap/ui-bootstrap-tpls'
    , 'angular-growl': 'angular-growl-v2/build/angular-growl.js'
    , 'angular-growl-css': 'angular-growl-v2/build/angular-growl.min.css'
    , 'localforage': 'localforage/dist/localforage.js'
    , 'socket.io': 'socket.io-client/dist/socket.io'
    , 'oboe': 'oboe/dist/oboe-browser'
    , 'ng-file-upload': 'ng-file-upload/angular-file-upload'
    }
  }
, module: {
    loaders: [
      { test: /\.css$/, loader: 'style!css' }
    , { test: /\.jpg$/, loader: "url-loader?limit=5000&mimetype=image/jpeg" }
    , { test: /\.png$/, loader: "url-loader?limit=5000&mimetype=image/png" }
    , { test: /\.gif$/, loader: "url-loader?limit=5000&mimetype=image/gif" }
    , { test: /\.svg$/
      , loader: "url-loader?limit=1&mimetype=image/svg+xml" }
    , { test: /\.woff$/
      , loader: "url-loader?limit=1&mimetype=application/font-woff" }
    , { test: /\.otf$/
      , loader: "url-loader?limit=1&mimetype=application/font-woff" }
    , { test: /\.ttf$/
      , loader: "url-loader?limit=1&mimetype=application/font-woff" }
    , { test: /\.eot$/
      , loader: "url-loader?limit=1&mimetype=vnd.ms-fontobject" }
    , { test: /\.jade/
      , loader: 'template-html-loader' }
    , { test: /\.html/, loader: 'html-loader' }
    , { test: /angular\.js/, loader: 'exports?angular'}
    , { test: /angular-route\.js/, loader: 'imports?angular=angular'}
    , { test: /angular-animate\.js/, loader: 'imports?angular=angular'}
    , { test: /angular-growl\.js/, loader: 'imports?angular=angular'}
    , { test: /oboe-browser\.js/, loader: 'imports?define=>false!exports?oboe'}
    , { test: /uuid\.js/, loader: 'imports?require=>false'}
    , { test: /localforage\.js/, loader: 'script'}
    , { test: /ui-bootstrap-tpls\.js/, loader: 'script'}
    , { test: /dialogs\.js/, loader: 'script'}
    ]
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
  ]
}
