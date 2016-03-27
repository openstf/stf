function SeqQueue(size, maxWaiting) {
  this.lo = 0
  this.size = size
  this.maxWaiting = maxWaiting
  this.waiting = 0
  this.list = new Array(size)
  this.locked = true
}

SeqQueue.prototype.start = function(seq) {
  this.locked = false
  // The loop in maybeConsume() will make sure that the value wraps correctly
  // if necessary.
  this.lo = seq + 1
  this.maybeConsume()
}

SeqQueue.prototype.stop = function() {
  this.locked = true
  this.maybeConsume()
}

SeqQueue.prototype.push = function(seq, handler) {
  if (seq >= this.size) {
    return
  }

  this.list[seq] = handler
  this.waiting += 1
  this.maybeConsume()
}

SeqQueue.prototype.maybeConsume = function() {
  if (this.locked) {
    return
  }

  while (this.waiting) {
    // Did we reach the end of the loop? If so, start from the beginning.
    if (this.lo >= this.size) {
      this.lo = 0
    }

    var handler = this.list[this.lo]
    // Have we received it yet?
    if (handler) {
      this.list[this.lo] = undefined
      handler()
      this.lo += 1
      this.waiting -= 1
    }
    // Are we too much behind? If so, just move on.
    else if (this.waiting >= this.maxWaiting) {
      this.lo += 1
      this.waiting -= 1
    }
    // We don't have it yet, stop.
    else {
      break
    }
  }
}

module.exports = SeqQueue
