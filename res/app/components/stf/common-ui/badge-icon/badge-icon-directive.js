module.exports = function badgeIconDirective() {
  return {
    restrict: 'EA',
    replace: true,
    scope: {
    },
    template: require('./badge-icon.pug'),
    link: function() {
    }
  }
}
