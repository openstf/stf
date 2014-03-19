var gulp = require('gulp')
var jshint = require('gulp-jshint')
var jsonlint = require('gulp-jsonlint')

gulp.task('jshint', function() {
  gulp.src(['lib/**/*.js', '*.js'])
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
