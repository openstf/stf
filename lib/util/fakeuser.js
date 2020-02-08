/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

const util = require('util')
const uuid = require('uuid')
const dbapi = require('../db/api')

module.exports.generate = function() {
  const name = 'fakeuser-' + util.format('%s', uuid.v4()).replace(/-/g, '')
  const email = name + '@openstf.com'

  return dbapi.createUser(email, name, '127.0.0.1').return(email)
}
