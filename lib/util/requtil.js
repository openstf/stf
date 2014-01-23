var util = require('util')

var Promise = require('bluebird')

function ValidationError(message, errors) {
  Error.call(this, message)
  this.name = 'ValidationError'
  this.errors = errors
  Error.captureStackTrace(this, ValidationError)
}

util.inherits(ValidationError, Error)

module.exports.ValidationError = ValidationError

module.exports.validate = function(req, rules) {
  return new Promise(function(resolve, reject) {
    rules()

    var errors = req.validationErrors()
    if (!errors) {
      resolve()
    }
    else {
      reject(new ValidationError('validation error', errors))
    }
  })
}
