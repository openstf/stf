module.exports = {
  cache: true
, debug: true
, devtool: 'inline-source-map'
, entry: './res/app/scripts/entry.js'
, output: {
    path: './res/app/build/'
  , filename: 'bundle.js'
  }
, resolve: {
    modulesDirectories: ['./res/bower_components', 'node_modules']
  }
, loaders: [
    { test: /\.css$/, loader: 'style!css' }
  , { test: /\.coffee$/, loader: 'coffee' }
  ]
}
