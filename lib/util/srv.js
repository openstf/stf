var Promise = require('bluebird')
var dns = Promise.promisifyAll(require('dns'))

function groupByPriority(records) {
  function sortByPriority(a, b) {
    return a.priority - b.priority
  }

  return records.sort(sortByPriority).reduce(function(acc, record) {
    if (acc.length) {
      var last = acc[acc.length - 1]
      if (last[0].priority !== record.priority) {
        acc.push([record])
      }
      else {
        last.push(record)
      }
    }
    else {
      acc.push([record])
    }
    return acc
  }, [])
}

function shuffleWeighted(records) {
  function sortByWeight(a, b) {
    return b.weight - a.weight
  }

  function totalWeight(records) {
    return records.reduce(function(sum, record) {
      return sum + record.weight
    }, 0)
  }

  function pick(records, sum) {
    var rand = Math.random() * sum
      , counter = 0

    for (var i = 0, l = records.length; i < l; ++i) {
      counter += records[i].weight
      if (rand < counter) {
        var picked = records.splice(i, 1)
        return picked.concat(pick(records, sum - picked[0].weight))
      }
    }

    return []
  }

  return pick(records.sort(sortByWeight), totalWeight(records))
}

function flatten(groupedRecords) {
  return groupedRecords.reduce(function(acc, group) {
    return acc.concat(group)
  }, [])
}

var RE_SRV = /^srv:(.*)$/

module.exports.sort = function(records) {
  return flatten(groupByPriority(records).map(shuffleWeighted))
}

module.exports.resolve = function(domain, defaultPort) {
  var match
  if ((match = RE_SRV.exec(domain))) {
    return dns.resolveSrvAsync(match[1])
      .then(module.exports.sort)
  }
  else {
    return Promise.resolve([{
      name: domain
    , port: defaultPort
    }])
  }
}
