var canvasElement = document.querySelector('canvas')
var frameNumberElement = document.querySelector('#frame-number')
var totalTimeElement = document.querySelector('#total-time')

var frame = {
  total: 5000,
  current: 0
}

var imageLoader = new FastImageLoader()

var imageRender = new FastImageRender(canvasElement, {render: 'canvas'})

function loadNext() {
  console.time('load')
//  var width = 300
//  var height = 300
  //  loader.src = 'http://placehold.it/' + width + 'x' + height + '?' + Date.now()
  //  loader.src = 'http://lorempixel.com/' + width + '/' + height + '/abstract/Frame-' + frames.current + '/?' + Date.now()
  imageLoader.load('screen.jpg?' + Date.now())
}

var startTime = new Date().getTime()

loadNext()

imageLoader.onLoad = function (image) {
  console.timeEnd('load')
  console.time('draw')
  imageRender.draw(image)
  console.timeEnd('draw')

  frameNumberElement.innerHTML = frame.current

  if (frame.current++ < frame.total) {
    loadNext()
  } else {
    var endTime = new Date().getTime()
    var totalTime = endTime - startTime
    totalTimeElement.innerHTML = totalTime / 1000 + ' seconds'
  }
}

