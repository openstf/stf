/**
 * @name waitUrl
 *
 * @description Wait until the URL changes to match a provided regex
 * @param {RegExp} urlRegex wait until the URL changes to match this regex
 * @returns {!webdriver.promise.Promise} Promise
 */
module.exports = function waitUrl(urlRegex) {
  var currentUrl

  return browser.getCurrentUrl().then(function storeCurrentUrl(url) {
      currentUrl = url
    }
  ).then(function waitForUrlToChangeTo() {
      return browser.wait(function waitForUrlToChangeTo() {
        return browser.getCurrentUrl().then(function compareCurrentUrl(url) {
          return urlRegex.test(url)
        })
      })
    }
  )
}
