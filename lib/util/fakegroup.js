/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

const util = require('util')
const uuid = require('uuid')
const dbapi = require('../db/api')
const apiutil = require('./apiutil')

module.exports.generate = function() {
  return dbapi.getRootGroup().then(function(rootGroup) {
    const now = Date.now()

    return dbapi.createUserGroup({
      name: 'fakegroup-' + util.format('%s', uuid.v4()).replace(/-/g, '')
    , owner: {
        email: rootGroup.owner.email
      , name: rootGroup.owner.name
      }
    , privilege: apiutil.ADMIN
    , class: apiutil.BOOKABLE
    , repetitions: 0
    , isActive: true
    , dates: apiutil.computeGroupDates(
        {
          start: new Date(now)
        , stop: new Date(now + apiutil.ONE_YEAR)
        }
      , apiutil.BOOKABLE
      , 0
      )
    , duration: 0
    , state: apiutil.READY
    })
    .then(function(group) {
      if (group) {
        return group.id
      }
      throw new Error('Forbidden (groups number quota is reached)')
    })
  })
}
