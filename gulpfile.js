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

gulp.task('build', ['webpack:build'], function () {
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

gulp.task('jade', function () {
  return gulp.src(['./res/**/*.jade', '!./res/bower_components/**'])
    .pipe(jade())
    .pipe(gulp.dest('./tmp/html/'))
})

gulp.task('translate:extract', function () {
  //'./res/**/*.js'
  return gulp.src(['./tmp/html/**/*.html',
    '!./res/bower_components/**'])
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
  gulp.src('./tmp', {read: false})
    .pipe(clean())
});


// TODO: convert this to gulp
// 1. extract task: jade->html+js->pot
// 2. compile task: po->js
//grunt.initConfig({
//  jade: {
//    translate: {
//      options: {
//        data: {
//          debug: false,
//          files: {
//            'tmp/html/all.html': ['res/app/**/*.jade']
//
//          }
//        }
//      }
//    }
//  },
//
//  'nggettext_extract': {
//    pot: {
//      files: {
//        'res/lang/po/template.pot': ['tmp/html/all.html', 'res/app/**/*.js']
//      }
//    }
//  },
//
//  'nggettext_compile': {
//    all: {
//      files: {
//        'res/lang/translations.js': ['res/lang/po/*.po']
//      }
//    }
//  }
//})
