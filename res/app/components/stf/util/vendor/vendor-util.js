module.exports = function VendorUtilFactory() {
  var vendorUtil = {}

  vendorUtil.style = function(props) {
    var testee = document.createElement('span')
    for (var i = 0, l = props.length; i < l; ++i) {
      if (typeof testee.style[props[i]] !== 'undefined') {
        return props[i]
      }
    }
    return props[0]
  }

  return vendorUtil
}
