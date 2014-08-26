var RE_CROP = /^([0-9]*)x([0-9]*)$/

module.exports = function(raw) {
  var parsed

  if (raw && (parsed = RE_CROP.exec(raw))) {
    return {
      width: +parsed[1] || 0
    , height: +parsed[2] || 0
    }
  }

  return null
}
