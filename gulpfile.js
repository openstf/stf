var gulp = require('gulp')
var gutil = require('gulp-util')
var jshint = require('gulp-jshint')
var jsonlint = require('gulp-jsonlint')
var webpack = require('webpack')
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
  return gulp.src(['.jshintrc', '.bowerrc', '.yo-rc.json', '*.json'])
    .pipe(jsonlint())
    .pipe(jsonlint.reporter())
})

gulp.task('lint', ['jshint', 'jsonlint'])
gulp.task('test', ['lint'])

gulp.task('build', ['translate', 'webpack:build'], function () {
})

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
    new webpack.optimize.UglifyJsPlugin()
  )

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

gulp.task('translate', ['jade', 'translate:extract', 'translate:compile'],
  function () {
  })

gulp.task('jade', function (callback) {
  gulp.src(['./res/**/*.jade', '!./res/bower_components/**'])
    .pipe(jade())
    .pipe(gulp.dest('./tmp/html/'))

  callback()
})

gulp.task('translate:extract', function (callback) {
  gulp.src(['./tmp/html/**/*.html', './res/**/*.js',
    '!./res/bower_components/**'])
    .pipe(gettext.extract('stf.pot'))
    .pipe(gulp.dest('./res/common/lang/po/'))

  callback()
})

gulp.task('translate:compile', function (callback) {
  gulp.src('./res/common/lang/po/**/*.po')
    .pipe(gettext.compile({
      format: 'json'
    }))
    .pipe(gulp.dest('./res/common/lang/translations/'))

  callback()
})

gulp.task('clean', function () {
  gulp.src('./tmp', {read: false})
    .pipe(clean())
})
