/* eslint no-console: 0 */

var canvasElement = document.querySelector('canvas')
var frameNumberElement = document.querySelector('#frame-number')
var totalTimeElement = document.querySelector('#total-time')

var frame = {
  total: 100,
  current: 0
}

function FastImageRender() {

}

var imageRender = new FastImageRender(
  canvasElement
, {
    render: 'canvas'
  , textureLoader: false
  }
)

function loadNext() {
  console.time('load')
//  var width = 300
//  var height = 300
  //  loader.src = 'http://placehold.it/' + width + 'x' + height + '?' +
  //    Date.now()
  //  loader.src = 'http://lorempixel.com/' + width + '/' + height +
  //    '/abstract/Frame-' + frames.current + '/?' + Date.now()
  imageRender.load('images/screen.jpg?' + Date.now())
//  imageRender.load('images/screen.jpg')
}

var startTime = new Date().getTime()

loadNext()

imageRender.onLoad = function(image) {
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
