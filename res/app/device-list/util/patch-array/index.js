function existenceMap(array) {
  var map = Object.create(null)
  for (var i = 0, l = array.length; i < l; ++i) {
    map[array[i]] = 1
  }
  return map
}

// Returns a list of operations to transform array a into array b. May not
// return the optimal set of operations.
module.exports = function patchArray(a, b) {
  var ops = []

  var workA = [].concat(a)
  var inA = Object.create(null)
  var itemA, cursorA, itemB, cursorB

  var inB = existenceMap(b)
  var posB = Object.create(null)

  // First, check what was removed from a.
  for (cursorA = 0; cursorA < workA.length;) {
    itemA = workA[cursorA]

    // If b does not contain the item, surely it must have been removed.
    if (!inB[itemA]) {
      workA.splice(cursorA, 1)
      ops.push(['remove', cursorA])
    }
    // Otherwise, the item is still alive.
    else {
      inA[itemA] = true
      cursorA += 1
    }
  }

  // Then, check what was inserted into b.
  for (cursorB = 0; cursorB < b.length; ++cursorB) {
    itemB = b[cursorB]

    // If a does not contain the item, it must have been added.
    if (!inA[itemB]) {
      workA.splice(cursorB, 0, itemB)
      ops.push(['insert', cursorB, itemB])
    }

    posB[itemB] = cursorB
  }

  // At this point, workA contains the same items as b, but swaps may
  // be needed.
  for (cursorA = 0; cursorA < workA.length;) {
    itemA = workA[cursorA]
    var posInB = posB[itemA]

    if (posInB === cursorA) {
      cursorA += 1
    }
    else {
      var temp = workA[posInB]
      workA[posInB] = itemA
      workA[cursorA] = temp
      ops.push(['swap', cursorA, posInB])
    }
  }

  return ops
}
