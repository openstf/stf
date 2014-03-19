var gulp = require('gulp')
var jshint = require('gulp-jshint')

gulp.task('lint', function() {
  gulp.src(['lib/**/*.js', '*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
})

gulp.task('test', ['lint'])
