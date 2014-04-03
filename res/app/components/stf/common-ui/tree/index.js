require('angular-tree-control/css/tree-control.css')
require('./tree.css')
require('angular-tree-control')

module.exports = angular.module('stf.tree', [
  'treeControl'
])
  .factory('TreeService', require('./tree-service'))
