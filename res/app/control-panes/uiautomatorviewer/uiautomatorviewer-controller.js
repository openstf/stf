
module.exports = function UiautomatorviewerCtrl($scope) {
  $scope.screenshot = null;
  $scope.showNode = null;
  $scope.nodesArray = null;

  $scope.get_xpath = "";
  $scope.xmlStr = "";
  $scope.pointR = 0;
  $scope.pointG = 0;
  $scope.pointB = 0;

  var parser = null;
  var tmpDoc = null;
  var canvas = document.getElementById("uiviewer-canvas");
  var context = canvas.getContext("2d");
  var treeDiv = document.getElementById("uiviewer-tree");
  var img = new Image();
  var scale = 1;
  var lastSelectNode = null;

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
    var ctxt = canvas.getContext('2d');
    var data = ctxt.getImageData(0, 0, x, y).data;
    for(var i = 0,len = data.length; i<len;i+=4){
      $scope.pointR = data[i]
      $scope.pointG = data[i+1]
      $scope.pointB = data[i+2]

    }

    if (!$scope.nodesArray) return;
    var node = searchSelectNode($scope.nodesArray, { x: x / scale, y: y / scale }, 9999).node1;
    $scope.selectNode(node);
  }


  $scope.searchXpath =  function(){
    if($scope.get_xpath == ""){
        alert("xpath is empty!");
        return;
    }else{

      var node = null;
      try
      {
        var node = selectSingleNode(tmpDoc, $scope.get_xpath);
      } catch(e){
        alert(e.message)
        return;
      }

      console.log(node);
      if(node == null){
        alert("cannot find node by xpath!");
        return;
      }
      var searchBounds = node.getAttribute('bounds');
      if(searchBounds == null){
        alert("node has no bounds，please search other xpath !");
        return;
      }
      var searchClass = node.getAttribute('class');
      var searchIndex = node.getAttribute('index');
      JSONNode = searchNodebyBoundsClassIndex($scope.nodesArray,searchBounds,searchClass,searchIndex);
      $scope.selectNode(JSONNode);
    }
  }

  function searchNodebyBoundsClassIndex(nodes, searchBounds,searchClass, searchIndex) {
    for (var node of nodes) {
      var bounds = node.attributes['bounds'];
      var cls = node.attributes['class'];
      var idx = node.attributes['index'];
      if (bounds == searchBounds && cls == searchClass && idx == searchIndex) {
        return node;
      } else if (node.children.length) {
        var childNode = searchNodebyBoundsClassIndex(node.children, searchBounds,searchClass, searchIndex)
        if (childNode != null) {
          return childNode;
        }
      }
    }
    return null;

  }

  function searchSelectNode(nodes, point, dist) {
    var resultNode = null
    for (var node of nodes) {
      var bounds = node.attributes['bounds'].match(/[\d\.]+/g);
      if (point.x > bounds[0] && point.x < bounds[2]
        && point.y > bounds[1] && point.y < bounds[3]) {
        var newDist = point.x + point.y - bounds[0] - bounds[1];
        if (newDist <= dist) {
          resultNode = node;
          dist = newDist;
          if (node.children.length) {
            var child = searchSelectNode(node.children, point, dist);
            if (child.node1 != null) {
              resultNode = child.node1;
              dist = child.dist1;
            }
          }
        }
      }
    }
    return { node1: resultNode, dist1: dist }
  }

  function generate_xpath(node){
    var nodeId = null;
    try{
      nodeId = node.getAttribute("resource-id")
    }catch(e){
      return "";
    }
    var nodeText = node.getAttribute("text");
    var nodeDesc = node.getAttribute("content-desc");
    var nodeIndex = parseInt(node.getAttribute("index"),10) + 1;
    if(nodeId != null && nodeId.trim() != ""){
      return "//*[@resource-id=\'" + nodeId + "\']";
    } else if (nodeText != null && nodeText.trim() != ""){
      return "//*[@text=\'" + nodeText + "\']";
    } else if (nodeDesc != null && nodeDesc.trim() != ""){
      return "//*[@content-desc=\'" + nodeDesc + "\']";
    }else if(node.parentNode != null && !isNaN(nodeIndex)){
        return generate_xpath(node.parentNode) + "/*["+ nodeIndex + "]";
    } else {
      return "/";
    }
  }

  $scope.selectNode = function (node) {
    if (lastSelectNode)
      lastSelectNode.selected = false;
    node.selected = true;

    lastSelectNode = node;

    var text = "";
    for (var key in node.attributes) {
      text += `${key} : ${node.attributes[key]}\n`
    }
    var bounds = node.attributes["bounds"];
    var nodeClass = node.attributes["class"];
    var nodeText = node.attributes["text"];
    var nodeDesc = node.attributes["content-desc"];
    var nodeId = node.attributes["resource-id"];
    if(nodeId == null){
      text += `${"xpath"} : ${"//*"}\n`
    } else{
      console.log(bounds,nodeClass,nodeText,nodeDesc,nodeId);
      var tmpNode = selectSingleNode(tmpDoc, "//*[@resource-id='" + nodeId +
      "' and @text='" + nodeText +
      "' and @content-desc='" + nodeDesc +
      "' and @bounds='" + bounds +
      "' and @class='" + nodeClass + "']");
      if(tmpNode != null){
        text += `${"xpath"} : ${generate_xpath(tmpNode)}\n`;
      } else {
        text += `${"xpath"} : ${"//*"}\n`
      }

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
        $scope.screenshot = result;
      })
      img.src = result.body.href
    })

    $scope.control.shell('uiautomator dump')
      .then(function (result) {
        var path = result.data.join('').split(':', 2)[1].trim();
        $scope.control.shell('cat ' + path)
          .then(function (result) {
            $scope.xmlStr = result.data.join('');
            parser = new DOMParser();
            tmpDoc = parser.parseFromString($scope.xmlStr,"text/xml");
            $scope.nodesArray = xml2json(angular.element(result.data.join(''))[1]);
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
        tmpJson.text += ':' + tmpJson.attributes.text;
      if (tmpJson.attributes['content-desc'])
        tmpJson.text += ' {' + tmpJson.attributes['content-desc'] + '}';
      if (tmpJson.attributes.bounds)
        tmpJson.text += ' ' + tmpJson.attributes.bounds;

      if (node.children)
        tmpJson.children = xml2json(node);

      jsonArray.push(tmpJson);
    }
    return jsonArray;
  }
  //跨浏览器获取单一节点
  function selectSingleNode(xmlDom, xpath) {
    var node = null;
    if (typeof xmlDom.evaluate != 'undefined') {
      var result = xmlDom.evaluate(xpath, xmlDom, null,
        XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      if (result !== null) {
        node = result.singleNodeValue;
      }
    } else if (typeof xmlDom.selectSingleNode != 'undefined') {
      node = xmlDom.selectSingleNode(xpath);
    }
    return node;
  }

  // 打开时先截图
  $scope.takeScreenShot();
}
