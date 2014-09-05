module.exports = function InstallCtrl(
  $scope
, $http
, $filter
, StorageService
) {
  function Installation(progress, state) {
    this.progress = progress
    this.state = state
    this.settled = false
    this.success = false
    this.error = null
    this.href = null
    this.manifest = null
    this.launch = true

    this.update = function(progress, state) {
      console.log('UPDATE', progress, state)
      $scope.safeApply(function () {
        this.progress = Math.floor(progress)
        this.state = state
      }.bind(this))
    }

    this.okay = function(state) {
      console.log('OKAY', state)
      $scope.safeApply(function () {
        this.settled = true
        this.progress = 100
        this.success = true
        this.state = state
      }.bind(this))
    }

    this.fail = function(err) {
      console.log('FAIL', err, this)
      $scope.safeApply(function () {
        this.settled = true
        this.progress = 100
        this.success = false
        this.error = err
      }.bind(this))
    }
  }

  function install(installation) {
    return $scope.control.install(installation)
      .progressed(function (result) {
        installation.update(50 + result.progress / 2, result.lastData)
      })
  }

  $scope.accordionOpen = true

  $scope.clear = function () {
    $scope.installation = null
    $scope.accordionOpen = false
  }

  $scope.installUrl = function (url) {
    var installation = $scope.installation = new Installation(0, 'uploading')
    return $scope.control.uploadUrl(url)
      .progressed(function (uploadResult) {
        installation.update(uploadResult.progress / 2, uploadResult.lastData)
      })
      .then(function (uploadResult) {
        installation.update(uploadResult.progress / 2, uploadResult.lastData)
        installation.manifest = uploadResult.body
        return install(installation)
      })
      .then(function() {
        installation.okay('installed')
      })
      .catch(function(err) {
        installation.fail(err.code || err.message)
      })
  }

  $scope.installFile = function ($files) {
    var installation = $scope.installation = new Installation(0, 'uploading')
    return StorageService.storeFile('apk', $files, {
        filter: function(file) {
          return /\.apk$/i.test(file.name)
        }
      })
      .progressed(function(e) {
        if (e.lengthComputable) {
          installation.update(e.loaded / e.total * 100 / 2, 'uploading')
        }
      })
      .then(function(res) {
        installation.update(100 / 2, 'processing')
        installation.href = res.data.resources.file.href
        return $http.get(installation.href + '/manifest')
          .then(function(res) {
            if (res.data.success) {
              installation.manifest = res.data.manifest
              return install(installation)
            }
            else {
              throw new Error('Unable to retrieve manifest')
            }
          })
      })
      .then(function() {
        installation.okay('installed')
      })
      .catch(function(err) {
        installation.fail(err.code || err.message)
      })
  }

  $scope.uninstall = function (packageName) {
    // TODO: After clicking uninstall accordion opens
    return $scope.control.uninstall(packageName)
      .then(function () {
        $scope.$apply(function () {
          $scope.clear()
        })
      })
  }
}
