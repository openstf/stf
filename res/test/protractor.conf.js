// Reference: https://github.com/angular/protractor/blob/master/referenceConf.js

exports.config = {
  specs: ['res/test/e2e/*spec.js'],
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000
  }
}
