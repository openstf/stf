function ImagePool(size) {
  this.size = size
  this.images = []
  this.counter = 0
}

ImagePool.prototype.next = function() {
  if (this.images.length < this.size) {
    var image = new Image()
    this.images.push(image)
    return image
  }
  else {
    if (this.counter >= this.size) {
      // Reset for unlikely but theoretically possible overflow.
      this.counter = 0
    }

    return this.images[this.counter++ % this.size]
  }
}

module.exports = ImagePool
