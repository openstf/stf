/* This is a fork of https://github.com/mllrsohn/gulp-protractor

 Changes:
 - Added debug support
 - Added suites support
 - Added element explorer support
 - Added feature to detect if selenium is running or not
 */

var es = require('event-stream')
var path = require('path')
var childProcess = require('child_process')
var PluginError = require('gulp-util').PluginError
var winExt = /^win/.test(process.platform) ? '.cmd' : ''
var http = require('http')
var Promise = require('bluebird')

// optimization: cache for protractor binaries directory
var protractorDir = null

function getProtractorDir() {
  if (protractorDir) {
    return protractorDir
  }
  var result = require.resolve('protractor')
  if (result) {
    // result is now something like
    // c:\\Source\\gulp-protractor\\node_modules\\protractor\\lib\\protractor.js
    protractorDir =
      path.resolve(path.join(path.dirname(result), '..', '..', '.bin'))
    return protractorDir
  }
  throw new Error('No protractor installation found.')
}

var protractor = function(opts) {
  var files = []
  var options = opts || {}
  var args = options.args || []
  var child

  if (!options.configFile) {
    this.emit('error', new PluginError('gulp-protractor',
      'Please specify the protractor config file'))
  }
  return es.through(function(file) {
    files.push(file.path)
  }, function() {
    var that = this

    // Enable debug mode
    if (options.debug) {
      args.push('debug')
    }

    // Enable test suits
    if (options.suite) {
      args.push('--suite')
      args.push(options.suite)
    }

    // Attach Files, if any
    if (files.length) {
      args.push('--specs')
      args.push(files.join(','))
    }

    // Pass in the config file
    args.unshift(options.configFile)

    child =
      childProcess.spawn(path.resolve(getProtractorDir() + '/protractor' +
      winExt), args, {
        stdio: 'inherit',
        env: process.env
      }).on('exit', function(code) {
        if (child) {
          child.kill()
        }
        if (that) {
          if (code) {
            that.emit('error', new PluginError('gulp-protractor',
              'protractor exited with code ' + code))
          }
          else {
            that.emit('end')
          }
        }
      })
  })
}

var webdriverUpdate = function(opts, cb) {
  var callback = cb || opts
  var options = (cb ? opts : null)
  var args = ['update', '--standalone']
  if (options) {
    if (options.browsers) {
      options.browsers.forEach(function(element) {
        args.push('--' + element)
      })
    }
  }
  childProcess.spawn(path.resolve(getProtractorDir() + '/webdriver-manager' +
  winExt), args, {
    stdio: 'inherit'
  }).once('close', callback)
}

var webdriverUpdateSpecific = function(opts) {
  return webdriverUpdate.bind(this, opts)
}

webdriverUpdate.bind(null, ['ie', 'chrome'])

var webdriverStandalone = function(opts, cb) {
  var callback = cb || opts
  var options = (cb ? opts : null)
  var stdio = 'inherit'

  if (options) {
    if (options.stdio) {
      stdio = options.stdio
    }
  }

  var child = childProcess.spawn(path.resolve(getProtractorDir() +
  '/webdriver-manager' + winExt), ['start'], {
    stdio: stdio
  })
    .once('close', callback)
    .on('exit', function(code) {
      if (child) {
        child.kill()
      }
    })
}

var protractorExplorerDir = null
function getProtractorExplorerDir() {
  if (protractorExplorerDir) {
    return protractorExplorerDir
  }
  var result = require.resolve('protractor')
  if (result) {
    // result is now something like
    // c:\\Source\\gulp-protractor\\node_modules\\protractor\\lib\\protractor.js
    protractorExplorerDir =
      path.resolve(path.join(path.dirname(result), '..', 'bin'))
    return protractorExplorerDir
  }
  throw new Error('No protractor installation found.')
}

var isWebDriverRunning = function() {
  return new Promise(function(resolve) {
    var options = {
      hostname: 'localhost',
      port: 4444,
      path: '/wd/hub/status'
    }

    var req = http.request(options, function(res) {
      if (res.statusCode !== 200) {
        throw new Error('Selenium is running but status code is' +
        res.statusCode)
      }
      resolve(true)
    })
    req.on('error', function() {
      resolve(false)
    })
    req.write('data\n')
    req.end()
    resolve(false)
  })
}

//var ensureWebDriverRunning = function () {
//  return new Promise(function (resolve) {
//    isWebDriverRunning().then(function (running) {
//      if (running) {
//        resolve()
//      }
//    })
//  })
//}


var protractorExplorer = function(opts, cb) {
  var callback = cb || opts
  var options = (cb ? opts : null)
  var url = 'https://angularjs.org/'

  if (options) {
    if (options.configFile) {
      var configFile = require(options.configFile)
      if (configFile.config && configFile.config.baseUrl) {
        url = configFile.config.baseUrl
      }
    }

    if (options.url) {
      url = options.url
    }
  }

  function runElementExplorer(callback) {
    var child = childProcess.spawn(path.resolve(getProtractorExplorerDir() +
    '/elementexplorer.js'), [url], {
      stdio: 'inherit'
    })
      .on('exit', function() {
        if (child) {
          child.kill()
        }
      })
      .once('close', callback)
  }

  function runWebDriver() {
    isWebDriverRunning().then(function(running) {
      if (running) {
        runElementExplorer(callback)
      } else {
        webdriverStandalone({stdio: ['pipe', 'pipe', process.stderr]},
          function() {

          })

        setTimeout(function() {
          runElementExplorer(callback)
        }, 2000)
      }
    })
  }
  runWebDriver()
}

module.exports = {
  getProtractorDir: getProtractorDir,
  protractor: protractor,
  webdriverStandalone: webdriverStandalone,
  webdriverUpdate: webdriverUpdate,
  webdriverUpdateSpecific: webdriverUpdateSpecific,
  protractorExplorer: protractorExplorer,
  isWebDriverRunning: isWebDriverRunning
}
