var gulp = require('gulp')
var jshint = require('gulp-jshint')
var jsonlint = require('gulp-jsonlint')

gulp.task('jshint', function() {
  return gulp.src(['lib/**/*.js', '*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
})

gulp.task('jsonlint', function() {
  return gulp.src(['.jshintrc', '.bowerrc', '.yo-rc.json', '*.json'])
    .pipe(jsonlint())
    .pipe(jsonlint.reporter())
})

gulp.task('lint', ['jshint', 'jsonlint'])
gulp.task('test', ['lint'])

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