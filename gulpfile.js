var gulp = require('gulp')
var gutil = require('gulp-util')
var jshint = require('gulp-jshint')
var jsonlint = require('gulp-jsonlint')
var webpack = require('webpack')
var ngminPlugin = require('ngmin-webpack-plugin')
var webpackConfig = require('./webpack.config').webpack
var webpackStatusConfig = require('./res/common/status/webpack.config')
var gettext = require('gulp-angular-gettext')
var jade = require('gulp-jade')
var clean = require('gulp-clean')
var protractor = require("gulp-protractor")
var protractorConfig = './res/test/protractor.conf'
var karma = require('karma').server
var karmaConfig = '/res/test/karma.conf.js'
var stream = require('stream')

gulp.task('jshint', function () {
  return gulp.src([
    'lib/**/*.js'
    , 'res/app/**/*.js'
    , 'res/auth-ldap/**/*.js'
    , 'res/auth-mock/**/*.js'
    , '*.js'
  ])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
})

gulp.task('jsonlint', function () {
  return gulp.src([
    '.jshintrc'
    , 'res/.jshintrc'
    , '.bowerrc'
    , '.yo-rc.json'
    , '*.json'
  ])
    .pipe(jsonlint())
    .pipe(jsonlint.reporter())
})

gulp.task('lint', ['jshint', 'jsonlint'])
gulp.task('test', ['lint', 'protractor'])
gulp.task('build', ['translate', 'webpack:build'])

gulp.task('karma_ci', function (done) {
  karma.start({
    configFile: __dirname + karmaConfig,
    singleRun: true
  }, done)
})

gulp.task('karma', function (done) {
  karma.start({
    configFile: __dirname + karmaConfig
  }, done)
})

gulp.task('webdriver_update', protractor.webdriver_update)
gulp.task('webdriver_standalone', protractor.webdriver_standalone)

gulp.task('protractor', function (callback) {
  gulp.src(["./res/test/e2e/**/*.js"])
    .pipe(protractor.protractor({
      configFile: protractorConfig
    }))
    .on('error', function (e) {
      console.log(e)
    }).on('end', callback)
})

// For piping strings
function fromString(filename, string) {
  var src = stream.Readable({ objectMode: true })
  src._read = function () {
    this.push(new gutil.File({
      cwd: '', base: '', path: filename, contents: new Buffer(string)
    }))
    this.push(null)
  }
  return src
}


// For production
gulp.task("webpack:build", function (callback) {
  var myConfig = Object.create(webpackConfig)
  myConfig.plugins = myConfig.plugins.concat(
    new webpack.DefinePlugin({
      "process.env": {
        "NODE_ENV": JSON.stringify('production')
      }
    })
    //new webpack.optimize.DedupePlugin(),
    //new ngminPlugin(),
    // TODO: mangle when ngmin works
    //new webpack.optimize.UglifyJsPlugin({mangle: false})
  )
  myConfig.devtool = false

  webpack(myConfig, function (err, stats) {
    if (err) {
      throw new gutil.PluginError('webpack:build', err)
    }

    gutil.log("[webpack:build]", stats.toString({
      colors: true
    }))

    // Save stats to a json file
    // Can be analyzed in http://webpack.github.io/analyse/
    fromString('stats.json', JSON.stringify(stats.toJson()))
      .pipe(gulp.dest('./tmp/'))

    callback()
  })
})

gulp.task("webpack:others", function (callback) {
  var myConfig = Object.create(webpackStatusConfig)
  myConfig.plugins = myConfig.plugins.concat(
    new webpack.DefinePlugin({
      "process.env": {
        "NODE_ENV": JSON.stringify('production')
      }
    }),
    new webpack.optimize.DedupePlugin()
//    new ngminPlugin(),
//    new webpack.optimize.UglifyJsPlugin({mangle: false})
  )
  myConfig.devtool = false

  webpack(myConfig, function (err, stats) {
    if (err) {
      throw new gutil.PluginError('webpack:others', err)
    }

    gutil.log("[webpack:others]", stats.toString({
      colors: true
    }))
    callback()
  })
})

gulp.task('translate', ['jade', 'translate:extract', 'translate:compile'])

gulp.task('jade', function (cb) {
  gulp.src([
    './res/**/*.jade'
    , '!./res/bower_components/**'
  ])
    .pipe(jade())
    .pipe(gulp.dest('./tmp/html/'))
  cb()
})

gulp.task('translate:extract', ['jade'], function (cb) {
  gulp.src([
    './tmp/html/**/*.html'
    , './res/**/*.js'
    , '!./res/bower_components/**'
    , '!./res/build/**'
  ])
    .pipe(gettext.extract('stf.pot'))
    .pipe(gulp.dest('./res/common/lang/po/'))
  cb()
})

gulp.task('translate:compile', ['translate:extract'], function (cb) {
  gulp.src('./res/common/lang/po/**/*.po')
    .pipe(gettext.compile({
      format: 'json'
    }))
    .pipe(gulp.dest('./res/common/lang/translations/'))
  cb()
})

gulp.task('clean', function () {
  return gulp.src(['./tmp', './res/build'], {read: false})
    .pipe(clean())
})
