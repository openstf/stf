module.exports = function () {
  var treeService = {}

  var tree = [
    {name: 'glossary', children: [
      {name: 'title'}
    ]}
  ]

  function createTreeFromJSON(tree, json) {


    (function updateRecursive(item) {
      if (item.iconSrc) {
        item.iconSrcFullpath = 'some value..';
      }
      _.each(item.items, updateRecursive);
    })(json);
  }


  $scope.treeOptions = {
    nodeChildren: 'children',
    dirSelectable: true,
    injectClasses: {
      ul: "a1",
      li: "a2",
      liSelected: "a7",
      iExpanded: "a3",
      iCollapsed: "a4",
      iLeaf: "a5",
      label: "a6",
      labelSelected: "a8"
    }
  }

  $scope.treeData = [
    { "name": "Joe", "age": "21", "children": [
      { "name": "Smith", "age": "42", "children": [] },
      { "name": "Gary", "age": "21", "children": [
        { "name": "Jenifer", "age": "23", "children": [
          { "name": "Dani", "age": "32", "children": [] },
          { "name": "Max", "age": "34", "children": [] }
        ]}
      ]}
    ]},
    { "name": "Albert", "age": "33", "children": [] },
    { "name": "Ron", "age": "29", "children": [] }
  ];

  return treeService
}