module.exports = function CpuCtrl() {


  //var RealTimeData = function (layers) {
  //  this.layers = layers;
  //  this.timestamp = ((new Date()).getTime() / 1000) | 0;
  //};
  //
  //RealTimeData.prototype.rand = function () {
  //  return parseInt(Math.random() * 100) + 50;
  //};
  //
  //RealTimeData.prototype.history = function (entries) {
  //  if (typeof(entries) != 'number' || !entries) {
  //    entries = 60;
  //  }
  //
  //  var history = [];
  //  for (var k = 0; k < this.layers; k++) {
  //    history.push({values: []});
  //  }
  //
  //  for (var i = 0; i < entries; i++) {
  //    for (var j = 0; j < this.layers; j++) {
  //      history[j].values.push({time: this.timestamp, y: this.rand()});
  //    }
  //    this.timestamp++;
  //  }
  //
  //  return history;
  //};
  //
  //RealTimeData.prototype.next = function () {
  //  var entry = [];
  //  for (var i = 0; i < this.layers; i++) {
  //    entry.push({time: this.timestamp, y: this.rand()});
  //  }
  //  this.timestamp++;
  //  return entry;
  //}
  //
  //window.RealTimeData = RealTimeData;
  //
  //
  //var liveAreaData = new RealTimeData(4)
  //
  //
  //function generateAreaData() {
  //  var values = [];
  //  var data = [
  //    {label: 'Sqrt', values: []},
  //    {label: 'Cbrt', values: []},
  //    {label: '4th', values: []}
  //  ];
  //  for (var i = 0; i <= 128; i++) {
  //    var x2 = 20 * (i / 128);
  //    data[0].values.push({x: x2, y: Math.sqrt(x2)});
  //    data[1].values.push({x: x2, y: Math.pow(x2, (1 / 3))});
  //    data[2].values.push({x: x2, y: Math.pow(x2, (1 / 4))});
  //  }
  //  return data;
  //}
  //
  //$scope.areaData = generateAreaData()
  //
  //$scope.realtimeArea = liveAreaData.history();
  //$scope.realtimeAreaFeed = liveAreaData.next();
  //$scope.getNextLiveArea = function () {
  //  $scope.realtimeAreaFeed = liveAreaData.next();
  //  $timeout($scope.getNextLiveArea, 1000);
  //}
  //$timeout($scope.getNextLiveArea, 1000);
  //
  //
  //$scope.areaAxes = ['left', 'right', 'bottom'];
  //$scope.lineAxes = ['right', 'bottom'];
  //$scope.scatterAxes = ['left', 'right', 'top', 'bottom'];

}
