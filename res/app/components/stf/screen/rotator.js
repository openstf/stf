var mapping = {
  0: {
    0: 0
  , 90: -90
  , 180: -180
  , 270: 90
  }
, 90: {
    0: 90
  , 90: 0
  , 180: -90
  , 270: 180
  }
, 180: {
    0: 180
  , 90: 90
  , 180: 0
  , 270: -90
  }
, 270: {
    0: -90
  , 90: -180
  , 180: 90
  , 270: 0
  }
}

module.exports = function rotator(oldRotation, newRotation) {
  var r1 = oldRotation < 0 ? 360 + oldRotation % 360 : oldRotation % 360
  var r2 = newRotation < 0 ? 360 + newRotation % 360 : newRotation % 360

  return mapping[r1][r2]
}
