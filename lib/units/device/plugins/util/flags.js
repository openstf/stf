var syrup = require('stf-syrup')

module.exports = syrup.serial()
  .dependency(require('./data'))
  .define(function(options, data) {
    return {
      has: function(flag) {
        return data && data.flags && !!data.flags[flag]
      }
    , get: function(flag, defaultValue) {
        return data && data.flags && typeof data.flags[flag] !== 'undefined' ?
          data.flags[flag] :
          defaultValue
      }
    }
  })
