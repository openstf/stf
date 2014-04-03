function SeqQueue() {
  this.queue = []
  this.seq = 0
}

SeqQueue.prototype.push = function(seq, handler) {
  this.queue[seq] = handler
  this.maybeDequeue()
}

SeqQueue.prototype.done = function(seq, handler) {
  this.queue[seq] = handler
  this.maybeDequeue()
}

SeqQueue.prototype.maybeDequeue = function() {
  var handler

  while ((handler = this.queue[this.seq])) {
    this.queue[this.seq] = void 0
    handler()
    this.seq += 1
  }
}

module.exports = SeqQueue
