/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

const timeutil = Object.create(null)

timeutil.now = function(unit) {
  const hrTime = process.hrtime()

  switch (unit) {
    case 'milli':
      return hrTime[0] * 1000 + hrTime[1] / 1000000
    case 'micro':
      return hrTime[0] * 1000000 + hrTime[1] / 1000
    case 'nano':
      return hrTime[0] * 1000000000 + hrTime[1]
    default:
      return hrTime[0] * 1000000000 + hrTime[1]
  }
}

module.exports = timeutil
