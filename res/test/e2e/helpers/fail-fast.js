// https://github.com/angular/protractor/issues/499

module.exports = function FailFast() {
  var passed = jasmine.getEnv().currentSpec.results().passed()
  if (!passed) {
    jasmine.getEnv().specFilter = function() {
      return false
    }
  }
}
