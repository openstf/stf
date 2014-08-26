var GRAVITY = {
  northwest: 'NorthWest'
, north: 'North'
, northeast: 'NorthEast'
, west: 'West'
, center: 'Center'
, east: 'East'
, southwest: 'SouthWest'
, south: 'South'
, southeast: 'SouthEast'
}

module.exports = function(raw) {
  var parsed

  if (raw && (parsed = GRAVITY[raw])) {
    return parsed
  }

  return null
}
