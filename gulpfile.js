var gulp = require('gulp')
var gutil = require('gulp-util')
var jshint = require('gulp-jshint')
var jsonlint = require('gulp-jsonlint')
var webpack = require('webpack')
var ngminPlugin = require('ngmin-webpack-plugin')
var webpackConfig = require('./webpack.config.js')
var gettext = require('gulp-angular-gettext')
var jade = require('gulp-jade')
var clean = require('gulp-clean')

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
gulp.task('test', ['lint'])
gulp.task('build', ['translate', 'webpack:build'])

// For production
gulp.task("webpack:build", function (callback) {
  var myConfig = Object.create(webpackConfig)
  myConfig.plugins = myConfig.plugins.concat(
    new webpack.DefinePlugin({
      "process.env": {
        "NODE_ENV": JSON.stringify('production')
      }
    }),
    new webpack.optimize.DedupePlugin(),
    new ngminPlugin(),
    new webpack.optimize.UglifyJsPlugin()
  )
  myConfig.devtool = false

  webpack(myConfig, function (err, stats) {
    if (err) {
      throw new gutil.PluginError('webpack:build', err)
    }

    gutil.log("[webpack:build]", stats.toString({
      colors: true
    }))
    callback()
  })
})

gulp.task('translate', ['jade', 'translate:extract', 'translate:compile'])

gulp.task('jade', function () {
  return gulp.src([
      './res/**/*.jade'
    , '!./res/bower_components/**'
    ])
    .pipe(jade())
    .pipe(gulp.dest('./tmp/html/'))
})

gulp.task('translate:extract', function () {
  return gulp.src([
      './tmp/html/**/*.html'
    , './res/**/*.js'
    , '!./res/bower_components/**'
    ])
    .pipe(gettext.extract('stf.pot'))
    .pipe(gulp.dest('./res/common/lang/po/'))
})

gulp.task('translate:compile', function () {
  return gulp.src('./res/common/lang/po/**/*.po')
    .pipe(gettext.compile({
      format: 'json'
    }))
    .pipe(gulp.dest('./res/common/lang/translations/'))
})

gulp.task('clean', function () {
  return gulp.src(['./tmp', './res/build'], {read: false})
    .pipe(clean())
})
