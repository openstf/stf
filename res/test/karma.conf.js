var _ = require('lodash')
var webpackConfig = require('./../../webpack.config')

var webpack = require('webpack')

module.exports = function (config) {
  config.set({
    frameworks: ['jasmine'],
    files: [
      'helpers/**/*.js',
      '../app/**/*-spec.js',
//      '../app/components/stf/common-ui/clear-button/*-spec.js'
    ],

    preprocessors: {
      'helpers/**/*.js': ['webpack'],
      '../app/**/*.js': ['webpack']
    },
    exclude: [

    ],

//    webpack: webpackConfig.webpack,
    webpack: {
      entry: {
        app: '../app/app.js'
      },
      cache: true,
      module: webpackConfig.webpack.module,
      resolve: webpackConfig.webpack.resolve,
      plugins: [
        new webpack.ResolverPlugin(
          new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin(
            'bower.json'
            , ['main']
          )
        )
      ]
    },
    webpackServer: {
      debug: true,
      devtool: 'eval',
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
