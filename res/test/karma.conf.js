var webpackConfig = require('./../../webpack.config')

var webpack = require('webpack')

module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    files: [
      'helpers/**/*.js',
      '../app/**/*-spec.js'
//      '../app/components/stf/common-ui/clear-button/*-spec.js'
    ],

    preprocessors: {
      'helpers/**/*.js': ['webpack'],
      '../**/*.js': ['webpack']
    },
    exclude: [

    ],

//    webpack: webpackConfig.webpack,
    webpack: {
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
      devtool: 'inline-source-map',
//      devtool: 'eval',
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
    // Chrome, ChromeCanary, Firefox, Opera, Safari, PhantomJS, IE
    browsers: ['Chrome'],
    //browsers: ['PhantomJS'],

    plugins: [
      require('karma-jasmine'),
      require('karma-webpack'),
      require('karma-chrome-launcher'),
      require('karma-firefox-launcher'),
      require('karma-phantomjs-launcher'),
      require('karma-junit-reporter'),
      require('karma-ie-launcher'),
      require('karma-safari-launcher')
      //require('karma-opera-launcher')
    ]
  })
}
