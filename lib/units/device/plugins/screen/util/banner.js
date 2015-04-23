var Promise = require('bluebird')

module.exports.read = function parseBanner(out) {
  var tryRead

  return new Promise(function(resolve, reject) {
    var readBannerBytes = 0
    var needBannerBytes = 2

    var banner = out.banner = {
      version: 0
    , length: 0
    , pid: 0
    , realWidth: 0
    , realHeight: 0
    , virtualWidth: 0
    , virtualHeight: 0
    , orientation: 0
    , quirks: {
        dumb: false
      , alwaysUpright: false
      , tear: false
      }
    }

    tryRead = function() {
      for (var chunk; (chunk = out.read(needBannerBytes - readBannerBytes));) {
        for (var cursor = 0, len = chunk.length; cursor < len;) {
          if (readBannerBytes < needBannerBytes) {
            switch (readBannerBytes) {
            case 0:
              // version
              banner.version = chunk[cursor]
              break
            case 1:
              // length
              banner.length = needBannerBytes = chunk[cursor]
              break
            case 2:
            case 3:
            case 4:
            case 5:
              // pid
              banner.pid +=
                (chunk[cursor] << ((readBannerBytes - 2) * 8)) >>> 0
              break
            case 6:
            case 7:
            case 8:
            case 9:
              // real width
              banner.realWidth +=
                (chunk[cursor] << ((readBannerBytes - 6) * 8)) >>> 0
              break
            case 10:
            case 11:
            case 12:
            case 13:
              // real height
              banner.realHeight +=
                (chunk[cursor] << ((readBannerBytes - 10) * 8)) >>> 0
              break
            case 14:
            case 15:
            case 16:
            case 17:
              // virtual width
              banner.virtualWidth +=
                (chunk[cursor] << ((readBannerBytes - 14) * 8)) >>> 0
              break
            case 18:
            case 19:
            case 20:
            case 21:
              // virtual height
              banner.virtualHeight +=
                (chunk[cursor] << ((readBannerBytes - 18) * 8)) >>> 0
              break
            case 22:
              // orientation
              banner.orientation += chunk[cursor] * 90
              break
            case 23:
              // quirks
              banner.quirks.dumb = (chunk[cursor] & 1) === 1
              banner.quirks.alwaysUpright = (chunk[cursor] & 2) === 2
              banner.quirks.tear = (chunk[cursor] & 4) === 4
              break
            }

            cursor += 1
            readBannerBytes += 1

            if (readBannerBytes === needBannerBytes) {
              return resolve(banner)
            }
          }
          else {
            reject(new Error(
              'Supposedly impossible error parsing banner'
            ))
          }
        }
      }
    }

    tryRead()

    out.on('readable', tryRead)
  })
  .finally(function() {
    out.removeListener('readable', tryRead)
  })
}
