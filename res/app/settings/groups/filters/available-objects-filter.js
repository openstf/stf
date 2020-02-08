/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

module.exports = function() {
  return function(objects, group, groupKey, objectKey) {
    const objectList = []

    objects.forEach(function(object) {
      if (group[groupKey].indexOf(object[objectKey]) < 0) {
        objectList.push(object)
      }
    })
    return objectList
  }
}

