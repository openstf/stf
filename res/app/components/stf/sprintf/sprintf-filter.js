module.exports = function sprintfFilter() {
  function parse(str) {
    var args = [].slice.call(arguments, 1)
    var i = 0

    return str.replace(/%s/g, function () {
      return args[i++]
    })
  }

  return function (input) {
    return parse(input, arguments[1], arguments[2], arguments[3], arguments[4], arguments[5])
  }
}
