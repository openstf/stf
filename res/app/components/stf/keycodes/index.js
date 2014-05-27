module.exports = angular.module('stf.keycodes', [

])
  .factory('KeycodesAndroid', function () {
    return require('./android/index.json')
  })
  .factory('KeycodesJS', function () {
    return require('./android/index.json')
  })
  .factory('KeycodesService', require('./keycodes-service'))
