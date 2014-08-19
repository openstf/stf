// Karma configuration

module.exports = function (config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    //basePath: '',


    frameworks: ['jasmine'],
    files: [
      //'test/*Test.*'
      '../app/*-test.js'
    ],
    exclude: [

    ],
    preprocessors: {
      '../app/*-test.js': ['webpack']
    },

    webpack: {
      cache: true,
      module: {
        loaders: [
//          { test: /\.coffee$/, loader: 'coffee-loader' }
        ]
      }
    },
    webpackServer: {
      stats: false
//      stats: {
//        colors: true
//      }
    },

    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress', 'junit'],

    junitReporter: {
      outputFile: 'test_out/junit.xml',
      suite: 'jqLite'
    },

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR ||
    // config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    //logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera (has to be installed with `npm install karma-opera-launcher`)
    // - Safari (only Mac has to be installed with `npm install karma-safari-launcher`)
    // - PhantomJS
    // - IE (only Windows has to be installed with `npm install karma-ie-launcher`)
    browsers: ['PhantomJS'],
//    browsers: ['Chrome'],

    plugins: [
      require('karma-jasmine'),
      require('karma-webpack'),
      require('karma-chrome-launcher'),
      require('karma-phantomjs-launcher'),
      require('karma-junit-reporter')
    ]
  })
}
