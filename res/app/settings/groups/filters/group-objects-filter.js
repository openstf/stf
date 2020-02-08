/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

module.exports = function(CommonService) {
  return function(keys, objects, objectsIndex) {
    const objectList = []

    keys.forEach(function(key) {
      if (CommonService.isExisting(objectsIndex[key])) {
        objectList.push(objects[objectsIndex[key].index])
      }
    })
    return objectList
  }
}

