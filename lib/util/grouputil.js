var util = require('util')

var Promise = require('bluebird')
var semver = require('semver')
var minimatch = require('minimatch')

var wire = require('../wire')

function RequirementMismatchError(name) {
  Error.call(this)
  this.name = 'RequirementMismatchError'
  this.message = util.format('Requirement mismatch for "%s"', name)
  Error.captureStackTrace(this, RequirementMismatchError)
}

util.inherits(RequirementMismatchError, Error)

module.exports.RequirementMismatchError = RequirementMismatchError

function AlreadyGroupedError() {
  Error.call(this)
  this.name = 'AlreadyGroupedError'
  this.message = 'Already a member of another group'
  Error.captureStackTrace(this, AlreadyGroupedError)
}

util.inherits(AlreadyGroupedError, Error)

module.exports.AlreadyGroupedError = AlreadyGroupedError

function NoGroupError() {
  Error.call(this)
  this.name = 'NoGroupError'
  this.message = 'Not a member of any group'
  Error.captureStackTrace(this, NoGroupError)
}

util.inherits(NoGroupError, Error)

module.exports.NoGroupError = NoGroupError

module.exports.match = Promise.method(function(capabilities, requirements) {
  return requirements.every(function(req) {
    var capability = capabilities[req.name]

    if (!capability) {
      throw new RequirementMismatchError(req.name)
    }

    switch (req.type) {
      case wire.RequirementType.SEMVER:
        if (!semver.satisfies(capability, req.value)) {
          throw new RequirementMismatchError(req.name)
        }
        break
      case wire.RequirementType.GLOB:
        if (!minimatch(capability, req.value)) {
          throw new RequirementMismatchError(req.name)
        }
        break
      case wire.RequirementType.EXACT:
        if (capability !== req.value) {
          throw new RequirementMismatchError(req.name)
        }
        break
      default:
        throw new RequirementMismatchError(req.name)
    }

    return true
  })
})
