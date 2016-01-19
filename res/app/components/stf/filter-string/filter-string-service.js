var _ = require('lodash')

module.exports = function FilterStringServiceFactory() {
  var service = {}

  /**
   * Filters integer
   *
   * @param {string} searchValue Value to search
   * @param {string} str Value to compare
   * @returns {boolean} true if matched
   */
  service.filterInteger = function(searchValue, str) {
    var matched = true
    matched = service.filterString(searchValue + '', str + '')
    return matched
  }

  /**
   * Filters string
   *
   * @param {string} searchValue Value to search
   * @param {string} str Value to compare
   * @returns {boolean} true if matched
   */
  service.filterString = function(searchValue, str) {
    var matched = true
    var searchLowerCase = searchValue.toLowerCase()
    var searchContent = searchValue.slice(1)
    var searchContentLowerCase = searchLowerCase.slice(1)
    switch (searchValue.charAt(0)) {
      case '/':
        var lastSlash = searchContent.lastIndexOf('/')
        if (lastSlash !== -1) {
          var pattern = searchContent.substring(0, lastSlash)
          var flags = searchContent.substring(lastSlash + 1)
          var regex = new RegExp(pattern, flags)
          matched = !_.isNull(str.match(regex))
        } else {
          matched = true // Regex is not complete, don't filter yet
        }
        break
      case '!':
        matched = str.toLowerCase().indexOf(searchContentLowerCase) === -1
        break
      default:
        matched = str.toLowerCase().indexOf(searchLowerCase) !== -1
    }
    return matched
  }

  return service
}
