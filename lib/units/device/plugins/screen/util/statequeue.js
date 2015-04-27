function StateQueue() {
  this.queue = []
}

StateQueue.prototype.next = function() {
  return this.queue.shift()
}

StateQueue.prototype.empty = function() {
  return this.queue.length === 0
}

StateQueue.prototype.push = function(state) {
  var found = false

  // Not super efficient, but this shouldn't be running all the time anyway.
  for (var i = 0, l = this.queue.length; i < l; ++i) {
    if (this.queue[i] === state) {
      this.queue.splice(i + 1)
      found = true
      break
    }
  }

  if (!found) {
    this.queue.push(state)
  }
}

module.exports = StateQueue
