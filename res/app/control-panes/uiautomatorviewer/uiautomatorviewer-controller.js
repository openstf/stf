
module.exports = function UiautomatorviewerCtrl($scope) {
  $scope.screenshot = null;
  $scope.showNode = null;
  $scope.nodesArray = null;

  var canvas = document.getElementById("uiviewer-canvas");
  var context = canvas.getContext("2d");
  var treeDiv = document.getElementById("uiviewer-tree");
  var img = new Image();
  var scale = 1;
  img.onload = function () {
    canvas.width = canvas.parentNode.offsetWidth;
    scale = canvas.width / this.width;
    canvas.height = this.height * scale;
    treeDiv.style.height = this.height * scale + "px";
    context.drawImage(this, 0, 0, this.width, this.height, 0, 0, canvas.width, canvas.height);
  };

  $scope.clickCanvas = function (event) {
    var x = event.pageX - canvas.getBoundingClientRect().left;
    var y = event.pageY - canvas.getBoundingClientRect().top;
    if (!$scope.nodesArray) return;
    var node = searchSelectNode($scope.nodesArray, { x: x / scale, y: y / scale });
    $scope.selectNode(node);
  }


  function searchSelectNode(nodes, point) {
    for (var node of nodes) {
      var bounds = node.attributes['bounds'].match(/[\d\.]+/g);
      if (point.x > bounds[0] && point.x < bounds[2]
        && point.y > bounds[1] && point.y < bounds[3]) {

        if (node.children.length) {
          var child = searchSelectNode(node.children, point)
          if (child)
            return child
        } else
          return node
      }
    }
  }

  var lastSelectNode = null;
  $scope.selectNode = function (node) {
    if (lastSelectNode)
      lastSelectNode.selected = false;
    node.selected = true;

    lastSelectNode = node;

    var text = "";
    for (var key in node.attributes) {
      text += `${key} : ${node.attributes[key]}\n`
    }
    $scope.showNode = { text: text }

    var bounds = node.attributes['bounds'].match(/[\d\.]+/g);
    for (var i = 0; i < bounds.length; i++)
      bounds[i] = bounds[i] * scale;

    context.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
    context.lineWidth = 2;
    context.strokeStyle = "#ff0000";
    context.strokeRect(bounds[0], bounds[1], bounds[2] - bounds[0], bounds[3] - bounds[1]);


  }

  $scope.takeScreenShot = function () {
    $scope.screenshot = null;
    $scope.showNode = null;
    $scope.nodesArray = null;
    $scope.control.screenshot().then(function (result) {
      $scope.$apply(function () {
        $scope.screenshot = result
      })
      img.src = result.body.href
    })

    $scope.control.shell('uiautomator dump')
      .then(function (result) {
        var path = result.data.join('').split(':', 2)[1].trim();
        $scope.control.shell('cat ' + path)
          .then(function (result) {
            $scope.nodesArray = xml2json(angular.element(result.data.join(''))[1])
            $scope.$digest();
          })
      })
  }

  function xml2json(xmldom) {
    var jsonArray = [];
    for (var node of xmldom.children) {
      var tmpJson = { attributes: {}, isCollapsed: false };
      for (var attr of node.attributes)
        tmpJson.attributes[attr.name] = attr.value;

      tmpJson.text = '(' + tmpJson.attributes.index + ')' + tmpJson.attributes.class.split('.').pop();
      if (tmpJson.attributes.text)
        tmpJson.text += ':' + tmpJson.attributes.text
      if (tmpJson.attributes['content-desc'])
        tmpJson.text += ' {' + tmpJson.attributes['content-desc'] + '}'
      if (tmpJson.attributes.bounds)
        tmpJson.text += ' ' + tmpJson.attributes.bounds

      if (node.children)
        tmpJson.children = xml2json(node);

      jsonArray.push(tmpJson);
    }
    return jsonArray;
  }
}
