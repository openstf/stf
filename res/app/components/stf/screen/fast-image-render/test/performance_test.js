var canvasElement = document.querySelector('canvas')
var frameNumberElement = document.querySelector('#frame-number')

var loader = new Image()
var width = 300
var height = 300

var frames = {
  total: 100,
  current: 0
}


function loadScreen() {
//  loader.src = 'http://placehold.it/' + width + 'x' + height + '?' + Date.now()
//  loader.src = 'http://lorempixel.com/' + width + '/' + height + '/abstract/Frame-' + frames.current + '/?' + Date.now()
  console.time('load')
  loader.src = 'screen.jpg?' + Date.now()
}

loadScreen()

var imageRender = new FastImageRender(canvasElement, {render: 'canvas'})


loader.onload = function () {
  console.timeEnd('load')
  console.time('draw')
  imageRender.draw(this)
  console.timeEnd('draw')

  frameNumberElement.innerHTML = frames.current

  if (frames.current++ < frames.total) {
    loadScreen()
  } else {

  }

}

loader.onerror = function (err) {
  console.error(err)
}
