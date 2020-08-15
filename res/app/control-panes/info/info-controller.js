require("chart.js")

module.exports = function InfoCtrl($scope, LightboxImageService) {
  $scope.openDevicePhoto = function (device) {
    var title = device.name
    var enhancedPhoto800 = '/static/app/devices/photo/x800/' + device.image
    LightboxImageService.open(title, enhancedPhoto800)
  }

  var getSdStatus = function () {
    if ($scope.control) {
      $scope.control.getSdStatus().then(function (result) {
        $scope.$apply(function () {
          $scope.sdCardMounted = (result.lastData === 'sd_mounted')
        })
      })
    }
  }
  getSdStatus();

  var drawChart = function (elementId, labelData, drawData, titleText, labelText, dataText) {
    var ctx =
      document.getElementById(elementId).getContext("2d");
    var dataGrid = [];
    for(i=0,l=drawData.length; i<l;i++){
      dataGrid.push({
        backgroundColor: 'rgb(199, 237, 233)',//绘制双曲线的时候最好使用rgba,要不不透明的白色背景可以使得某些线条绘制不出来
        borderColor: 'rgb(0, 90, 171)',
        borderWidth: 1.5,
        lineTension: 0.1,
        pointBackgroundColor: 'rgb(0, 90, 171)',
        pointBorderColor: 'rgb(0, 90, 171)',
        pointBorderWidth: 2,
        pointRadius: 1,
        pointHitRadius: 1,
        pointHoverBackgroundColor: 'rgb(255, 99, 99)',
        pointHoverBorderColor: 'rgb(255, 99, 99)',
        pointHoverRadius: 3,
        data: drawData[i],
        }
      )
    }

    var chart = new Chart(ctx, {
      // The type of chart we want to create
      type: 'line',
      // The data for our dataset
      data: {
        labels: labelData,
        datasets: dataGrid
      },
      // 配置文件
      options: {
        //标题设置
        title: {
          display: true,
          text: titleText,
        },
        //禁用动画
        animation: {
          duration: 0,
        },
        hover: {
          animationDuration: 0,
        },
        responsiveAnimationDuration: 0,
        //提示功能
        tooltips: {
          enable: false
        },
        //顶部的文字提示
        legend: {
          display: false,
        },
        //设置x,y轴网格线显示,标题等
        scales: {
          xAxes: [{
            //轴标题
            scaleLabel: {
              display: true,
              labelString: labelText,
              fontColor: '#666'
            },
            //网格显示
            gridLines: {
              display: false
            },


          }],
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: dataText
            },
            gridLines: {
              display: false
            },

          }],

        },

        //禁用赛尔曲线
        elements: {
          line: {
            tension: 0,
          }
        }

      }
    });
    return chart;
  }
  $scope.chartCPU = null;
  $scope.chartMM = null;
  $scope.chartTraffic = null;
  $scope.pid = '';
  $scope.cpuDate = null;
  $scope.mmDate = null;
  $scope.trafficDate = null;
  $scope.appName = "cmb.pb";
  $scope.timeGap = 3000;
  var title = "CPU使用率";
  var lbl = "时间（秒）";
  var dtext = "使用率（%）";
  var elementIdCPU = "cpuchart";

  var cpuIdx = 0;
  var titleMM = "内存使用率";
  var lblMM = "时间（秒）";
  var dtextMM = "使用（KB）";
  var elementIdMM = "mmchart";
  var titleTraffic = "流量统计";
  var lblTraffic = "时间（秒）";
  var dtextTraffic = "使用（KB）";
  var elementIdTraffic = "trafficchart";
  var oldTraffic = null;
  var lastTraffic = null;

  function addData(chart, label, data) {
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
      dataset.data.push(data);
  });
    chart.update();
  }

  syncData = function () {
    $scope.chartCPU = null;
    $scope.chartMM = null;
    $scope.chartTraffic = null;
    $scope.pid = '';
    $scope.cpuDate = null;
    $scope.mmDate = null;
    $scope.trafficDate = null;
    cpuIdx = 0;
    oldTraffic = null;
    lastTraffic = null;
  }

  keepDrawingCPU = function (elementId, title, lbl, dtext) {
    if ($scope.chartCPU == null) {
      console.log("creating chart...: ")
      $scope.chartCPU = drawChart(elementId, [], [[]], title, lbl, dtext);
    }

    $scope.control.shell('top -n 1')
      .then(function (result) {

        var tmpCPU = 0;
        // console.log("get cpu result ",result.data);
        var cpuResult = result.data.join('').split('\n');
        for (j = 0, l = cpuResult.length; j < l; j++) {
          if (cpuIdx == 0) {
            if (cpuResult[j].indexOf("CPU") != -1) {
              var tmpList = cpuResult[j].split(/[ ]+/);
              console.log("line: ", cpuResult[j]);
              for (i = 0, len = tmpList.length; i < len; i++) {
                if (tmpList[i].indexOf("CPU") != -1) {
                  cpuIdx = i;
                  console.log("get cpu in colum: ", cpuIdx);
                  break;
                }
              }
            }
          }
          if (cpuResult[j].indexOf($scope.appName) != -1 && cpuResult[j].indexOf($scope.appName + ":") == -1) {
            // console.log("line: ", cpuResult[j]);
            var tmpList = cpuResult[j].split(/[ ]+/);
            tmpCPU = tmpList[cpuIdx].trim().replace('%', '');
            if (isNaN(tmpCPU)) {
              tmpCPU = tmpList[cpuIdx - 1].trim().replace('%', '');
            }
            if (isNaN(tmpCPU)) {
              tmpCPU = tmpList[cpuIdx + 1].trim().replace('%', '');
            }
            if (isNaN(tmpCPU)) {
              console.log("cannot get CPU, only get: ", tmpCPU);
              return;
            }
            var tmpDate = new Date();
            if($scope.cpuDate == null){
              $scope.cpuDate = new Date();
            }
            console.log("timeStamps:", tmpDate - $scope.cpuDate);

            addData($scope.chartCPU,parseInt((tmpDate - $scope.cpuDate)/1000),tmpCPU)

            console.log("get cpu: ", tmpCPU);
            break;
          }
        }
      })
  }



  keepDrawingMM = function (elementId, title, lbl, dtext) {
    if ($scope.chartMM == null) {
      console.log("creating mm chart... ")
      $scope.chartMM = drawChart(elementId, [], [[]], title, lbl, dtext);

    }


    $scope.control.shell('ps -A')
      .then(function (result) {
        var pidResult = result.data.join('').split('\n');
        for (j = 0, l = pidResult.length; j < l; j++) {
          if (pidResult[j].indexOf($scope.appName) != -1 && pidResult[j].indexOf($scope.appName + ":") == -1) {
            var tmpList = pidResult[j].split(/[ ]+/);
            $scope.pid = tmpList[1].trim();
            console.log("found pid: " + $scope.pid);
            break;
          }
        }
      });

    if ($scope.pid == ""){
      console.log('pid not found.')
      return;
    }

    $scope.control.shell("dumpsys meminfo " + $scope.pid)
      .then(function (result) {

        var tmpMM = 0;
        // console.log("get mm result ",result.data);
        var mmResult = result.data.join('').split('\n');
        for (j = 0, l = mmResult.length; j < l; j++) {
          if (mmResult[j].indexOf("TOTAL") != -1) {
            var tmpList = mmResult[j].split(/[ ]+/);
            console.log("line: ", mmResult[j]);
            tmpMM = tmpList[2]
            if (isNaN(tmpMM)) {
              console.log("cannot get MM, only get: ", tmpMM);
              return;
            }
            var tmpDate = new Date();
            if($scope.mmDate == null){
              $scope.mmDate = new Date();
            }
            console.log("timeStamps:", tmpDate - $scope.mmDate);
            addData($scope.chartMM, parseInt((tmpDate - $scope.mmDate)/1000), tmpMM);
            console.log("get mm: ", tmpMM);
            break;
          }
        }
      });
  }

  keepDrawingTraffic = function (elementId, title, lbl, dtext) {
    if ($scope.chartTraffic == null) {
      console.log("creating traffic chart... ")
      $scope.chartTraffic = drawChart(elementId, [], [[],[]], title, lbl, dtext);

    }

    $scope.control.shell('ps -A')
      .then(function (result) {
        var pidResult = result.data.join('').split('\n');
        for (j = 0, l = pidResult.length; j < l; j++) {
          if (pidResult[j].indexOf($scope.appName) != -1 && pidResult[j].indexOf($scope.appName + ":") == -1) {
            var tmpList = pidResult[j].split(/[ ]+/);
            $scope.pid = tmpList[1].trim();
            console.log("found pid: " + $scope.pid);
            break;
          }
        }
      });

    if ($scope.pid == ""){

      $scope.control.shell('ps')
        .then(function (result) {
          var pidResult = result.data.join('').split('\n');
          for (j = 0, l = pidResult.length; j < l; j++) {
            if (pidResult[j].indexOf($scope.appName) != -1 && pidResult[j].indexOf($scope.appName + ":") == -1) {
              var tmpList = pidResult[j].split(/[ ]+/);
              $scope.pid = tmpList[1].trim();
              console.log("found pid: " + $scope.pid);
              break;
            }
          }
        });

      if ($scope.pid == ""){
        console.log('pid not found.')
        return;
      }
    }

    $scope.control.shell("cat /proc/" + $scope.pid + "/net/dev")
      .then(function (result) {
        var tmpReceived = 0;
        var tmpSend = 0;
        var tmpTraffic = 0;
        console.log("get traffic result ",result.data);
        var mmResult = result.data.join('').split('\n');

        for (j = 0, l = mmResult.length; j < l; j++) {
          if (mmResult[j].indexOf("wlan0") != -1) {
            var tmpList = mmResult[j].split(/[ ]+/);
            // console.log("line: ", mmResult[j]);
            tmpReceived = tmpList[2];
            tmpSend = tmpList[10];
            tmpTraffic += parseInt(tmpReceived/1024 + tmpSend/1024);
          }
          if (mmResult[j].indexOf("rmnet0") != -1) {
            var tmpList = mmResult[j].split(/[ ]+/);
            console.log("line: ", mmResult[j]);
            tmpReceived = tmpList[1];
            tmpSend = tmpList[9];
            tmpTraffic += parseInt(tmpReceived/1024 + tmpSend/1024);
          }
          if (mmResult[j].indexOf("rmnet_data0") != -1) {
            var tmpList = mmResult[j].split(/[ ]+/);
            console.log("line: ", mmResult[j]);
            tmpReceived = tmpList[1];
            tmpSend = tmpList[9];
            tmpTraffic += parseInt(tmpReceived/1024 + tmpSend/1024);
          }
        }

        if (isNaN(tmpTraffic) || tmpTraffic < 0) {
          console.log("cannot get Traffic, only get: ", tmpTraffic);
          return;
        }
        // console.log("received: ", tmpReceived, "send: ", tmpSend);
        if(oldTraffic == null){
          oldTraffic = tmpTraffic;
        }
        if(lastTraffic == null){
          lastTraffic = tmpTraffic;
        }
        console.log("last traffic : ", lastTraffic,"tmpTraffic : ", tmpTraffic);

        var tmpDate = new Date();
        if($scope.trafficDate == null){
          $scope.trafficDate = new Date();
        }
        $scope.chartTraffic.data.labels.push(parseInt((tmpDate - $scope.trafficDate)/1000));
        $scope.chartTraffic.data.datasets[0].data.push(tmpTraffic - lastTraffic);
        $scope.chartTraffic.data.datasets[0].backgroundColor = 'rgb(92, 167, 186)';
        $scope.chartTraffic.data.datasets[1].data.push(tmpTraffic - oldTraffic);
        $scope.chartTraffic.update();

        lastTraffic = tmpTraffic;
      });

  }


  drawCPU = function () {
    keepDrawingCPU(elementIdCPU, title, lbl, dtext);
    $scope.lastCPUInterval = setInterval(function () { keepDrawingCPU(elementIdCPU, title, lbl, dtext) }, $scope.timeGap);
    console.log("Registered: ", $scope.lastCPUInterval)
  }

  drawMM = function () {
    keepDrawingMM(elementIdMM, titleMM, lblMM, dtextMM);
    $scope.lastMMInterval = setInterval(function () { keepDrawingMM(elementIdMM, titleMM, lblMM, dtextMM) }, $scope.timeGap);
    console.log("Registered: ", $scope.lastMMInterval)
  }

  drawTraffic = function () {
    keepDrawingTraffic(elementIdTraffic, titleTraffic, lblTraffic, dtextTraffic);
    $scope.lastTrafficInterval = setInterval(function () { keepDrawingTraffic(elementIdTraffic, titleTraffic, lblTraffic, dtextTraffic) }, $scope.timeGap);
    console.log("Registered: ", $scope.lastTrafficInterval)
  }

  drawCPU();
  drawMM();
  drawTraffic();

  $scope.reCollect = function (){
    console.log("destroying: ", $scope.lastCPUInterval)
    clearInterval($scope.lastCPUInterval);
    console.log("destroying: ", $scope.lastMMInterval)
    clearInterval($scope.lastMMInterval);
    console.log("destroying: ", $scope.lastTrafficInterval)
    clearInterval($scope.lastTrafficInterval);
    syncData();
    drawCPU();
    drawMM();
    drawTraffic();
  }

  $scope.$on("$destroy", function () {
    console.log("destroying: ", $scope.lastCPUInterval)
    clearInterval($scope.lastCPUInterval);
    console.log("destroying: ", $scope.lastMMInterval)
    clearInterval($scope.lastMMInterval);
    console.log("destroying: ", $scope.lastTrafficInterval)
    clearInterval($scope.lastTrafficInterval);
  })


}
