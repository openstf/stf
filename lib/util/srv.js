var url = require('url')
var util = require('util')

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

module.exports.sort = function(records) {
  return flatten(groupByPriority(records).map(shuffleWeighted))
}

module.exports.resolve = function(domain) {
  var parsedUrl = url.parse(domain)

  if (!parsedUrl.protocol) {
    return Promise.reject(new Error(
      'Must include protocol in "%s"'
    , domain
    ))
  }

  if (/^srv\+/.test(parsedUrl.protocol)) {
    parsedUrl.protocol = parsedUrl.protocol.substr(4)
    return dns.resolveSrvAsync(parsedUrl.hostname)
      .then(module.exports.sort)
      .then(function(records) {
        return records.map(function(record) {
          parsedUrl.host = util.format('%s:%d', record.name, record.port)
          parsedUrl.hostname = record.name
          parsedUrl.port = record.port
          record.url = url.format(parsedUrl)
          return record
        })
      })
  }
  else {
    return Promise.resolve([{
      url: domain
    , name: parsedUrl.hostname
    , port: parsedUrl.port
    }])
  }
}
