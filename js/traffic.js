var colorDead,
  colorAcci,
  colorDeadScale,
  colorAcciScale,
  lngDim,
  latDim,
  weekDayTable,
  gPrints,
  monthDim,
  weekdayDim,
  hourDim,
  map,
  barAcciHour,
  initMap,
  ifdead,
  setCircle,
  initCircle,
  tranCircle,
  updateGraph,
  dataTable,
  dataTableDim,
  formatDateTime,
  decodeCode,
  weatherMap,
  lightMap,
  roadCategoryMap,
  roadTypeMap,
  accidentLocationMap,
  accidentTypeMap;
colorDead = "#de2d26";
colorAcci = "rgb(255, 204, 0)";
colorDeadScale = d3.scale.ordinal().range([colorDead]);
colorAcciScale = d3.scale.ordinal().range([colorAcci]);
lngDim = null;
latDim = null;
weekDayTable = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
gPrints = null;
monthDim = null;
weekdayDim = null;
hourDim = null;
map = null;
barAcciHour = null;
weatherMap = {
  1: "暴雨",
  2: "強風",
  3: "風沙",
  4: "霧或煙",
  5: "雪",
  6: "雨",
  7: "陰",
  8: "晴",
};
lightMap = {
  1: "日間自然光線",
  2: "晨或暮光",
  3: "夜間有照明",
  4: "夜間無照明",
};
roadCategoryMap = {
  1: "國道",
  2: "省道",
  3: "縣道",
  4: "鄉道",
  5: "市區道路",
  6: "村里道路",
  7: "專用道路",
  8: "其他",
};
roadTypeMap = {
  1: "有遮斷器",
  2: "無遮斷器",
  3: "三岔路",
  4: "四岔路",
  5: "多岔路",
  6: "隧道",
  7: "地下道",
  8: "橋樑",
  9: "涵洞",
  10: "高架道路",
  11: "彎曲路及附近",
  12: "坡路",
  13: "巷弄",
  14: "直路",
  15: "其他",
  16: "圓環",
  17: "廣場",
};
accidentLocationMap = {
  1: "交岔路口內",
  2: "交岔口附近",
  3: "機車待轉區",
  4: "機車停等區",
  5: "交通島（含槽化線）",
  6: "迴轉道",
  7: "快車道",
  8: "慢車道",
  9: "一般車道",
  10: "公車專用道",
  11: "機車專用道",
  12: "機車優先道",
  13: "路肩、路緣",
  14: "加速車道",
  15: "減速車道",
  16: "直線匝道",
  17: "環道匝道",
  18: "行人穿越道",
  19: "穿越道附近",
  20: "人行道",
  21: "收費站附近",
  22: "其他",
};
accidentTypeMap = {
  1: "對向通行中",
  2: "同向通行中",
  3: "穿越道路中",
  4: "在路上嬉戲",
  5: "在路上作業中",
  6: "衝進路中",
  7: "從停車後（或中）穿出",
  8: "佇立路邊（外）",
  9: "其他（人與車）",
  10: "對撞",
  11: "對向擦撞",
  12: "同向擦撞",
  13: "追撞",
  14: "倒車撞",
  15: "路口交岔撞",
  16: "側撞",
  17: "其他（車與車）",
  18: "路上翻車、摔倒",
  19: "衝出路外",
  20: "撞護欄（樁）",
  21: "撞號誌、標誌桿",
  22: "撞收費亭",
  23: "撞交通島",
  24: "撞非固定設施",
  25: "撞橋樑、建築物",
  26: "撞路樹、電桿",
  27: "撞動物",
  28: "撞工程施工",
  29: "其他（車本身）",
  30: "衝過遮斷器",
  31: "正越過平交道中",
  32: "暫停位置不當",
  33: "在平交道內無法行動",
  34: "其他（平交道）",
};
initMap = function () {
  map = L.map("map", {
    center: [24.8, 121.01],
    zoom: 12,
    zoomControl: true,
  });
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 19,
    attribution:
      "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors &copy; <a href=\"https://carto.com/attributions\">CARTO</a>",
    subdomains: "abcd",
  }).addTo(map);
  L.svg().addTo(map);
  gPrints = d3
    .select(map.getPanes().overlayPane)
    .select("svg")
    .append("g")
    .attr("class", "leaflet-zoom-hide");
  map.on("moveend", function () {
    var bounds, northEast, southWest;
    bounds = map.getBounds();
    northEast = bounds.getNorthEast();
    southWest = bounds.getSouthWest();
    lngDim.filterRange([southWest.lng, northEast.lng]);
    latDim.filterRange([southWest.lat, northEast.lat]);
    updateGraph();
    return dc.redrawAll();
  });
};
ifdead = function (it, iftrue, iffalse) {
  if (it.dead > 0) {
    return iftrue;
  } else {
    return iffalse;
  }
};
formatDateTime = function (it) {
  var pad;
  pad = function (n) {
    return ("0" + n).slice(-2);
  };
  return (
    it["年"] + "年" +
    it["月"] + "月" +
    it["日"] + "日 " +
    pad(it["時"]) +
    ":" +
    pad(it["分"])
  );
};
decodeCode = function (value, map, len) {
  var normalized;
  if (value == null || value === "") {
    return "未提供";
  }
  normalized = value.toString().trim();
  if (len != null && normalized.length < len) {
    normalized = normalized.padStart(len, "0");
  }
  return map[normalized] || map[+normalized] || "未提供";
};
setCircle = function (it) {
  return it
    .attr({
      cx: function (it) {
        return map.latLngToLayerPoint([it.GoogleLat, it.GoogleLng]).x;
      },
      cy: function (it) {
        return map.latLngToLayerPoint([it.GoogleLat, it.GoogleLng]).y;
      },
      r: function (it) {
        return ifdead(it, "5px", "2.5px");
      },
    })
    .style({
      fill: function (it) {
        return ifdead(it, colorDead, colorAcci);
      },
      position: "absolute",
      opacity: function (it) {
        return ifdead(it, 1, 0.3);
      },
    });
};
initCircle = function (it) {
  return it.style({
    opacity: 0,
  });
};
tranCircle = function (it) {
  return it.style({
    opacity: function (it) {
      return ifdead(it, 1, 0.3);
    },
  });
};
updateGraph = function () {
  var dt;
  dt = gPrints.selectAll("circle").data(monthDim.top(Infinity));
  dt.enter().append("circle").call(setCircle);
  dt.call(setCircle);
  return dt.exit().remove();
};
d3.tsv("./accidentXY.tsv", function (err, tsvBody) {
  var deadData,
    barPerMonth,
    barPerWeekDay,
    barPerHour,
    barAcciMonth,
    barAcciWeekDay,
    ndx,
    all,
    acciMonth,
    acciWeekDay,
    acciHour,
    deathMonth,
    deathWeekDay,
    deathHour,
    barMt,
    barWk,
    barHr,
    marginMt,
    marginWk,
    marginHr,
    navls,
    navidx,
    nav;
  deadData = [];
  tsvBody.filter(function (d) {
    d.GoogleLng = +d.GoogleLng;
    d.GoogleLat = +d.GoogleLat;
    // 將時間欄位轉成數字，避免交叉篩選時以字串比較導致範圍內沒有資料
    d["年"] = +d["年"];
    d["月"] = +d["月"];
    d["日"] = +d["日"];
    d["時"] = +d["時"];
    d["分"] = +d["分"];
    d.date = new Date(d["年"] + 1911, d["月"] - 1, d["日"], d["時"], d["分"]);
    d.week = weekDayTable[d.date.getDay()];
    d.dead = +d["2-30"] + +d["死"];
    d.injury = +d["受傷"];
    d.weather = decodeCode(d["天候"], weatherMap, 1);
    d.light = decodeCode(d["光線"], lightMap, 1);
    d.roadCategory = decodeCode(d["道路類別"], roadCategoryMap, 1);
    d.roadType = decodeCode(d["道路型態"], roadTypeMap, 2);
    d.accidentLocation = decodeCode(d["事故位置"], accidentLocationMap, 2);
    d.accidentType = decodeCode(d["事故類型及型態"], accidentTypeMap, 2);
    d.countyLocation = (d["縣市"] || "") + " " + (d.allLocation || "");
    if (d.dead > 0) {
      deadData.push(d);
    }
    return true;
  });
  barPerMonth = dc.barChart("#DeathMonth");
  barPerWeekDay = dc.barChart("#DeathWeekDay");
  barPerHour = dc.barChart("#DeathHour");
  barAcciMonth = dc.barChart("#AcciMonth");
  barAcciWeekDay = dc.barChart("#AcciWeekDay");
  barAcciHour = dc.barChart("#AcciHour");
  dataTable = dc.dataTable("#AccidentTable");
  ndx = crossfilter(tsvBody);
  all = ndx.groupAll();
  monthDim = ndx.dimension(function (it) {
    return it["月"];
  });
  weekdayDim = ndx.dimension(function (it) {
    return it.week;
  });
  hourDim = ndx.dimension(function (it) {
    return it["時"];
  });
  lngDim = ndx.dimension(function (it) {
    return it.GoogleLng;
  });
  latDim = ndx.dimension(function (it) {
    return it.GoogleLat;
  });
  dataTableDim = ndx.dimension(function (it) {
    return it.date;
  });
  initMap();
  acciMonth = monthDim.group().reduceCount();
  acciWeekDay = weekdayDim.group().reduceCount();
  acciHour = hourDim.group().reduceCount();
  deathMonth = monthDim.group().reduceSum(function (it) {
    return it.dead;
  });
  deathWeekDay = weekdayDim.group().reduceSum(function (it) {
    return it.dead;
  });
  deathHour = hourDim.group().reduceSum(function (it) {
    return it.dead;
  });
  barMt = 350;
  barWk = 270;
  barHr = 550;
  marginMt = {
    top: 10,
    right: 10,
    left: 30,
    bottom: 20,
  };
  marginWk = marginMt;
  marginHr = marginMt;
  barPerMonth
    .width(barMt)
    .height(100)
    .margins(marginMt)
    .dimension(monthDim)
    .group(deathMonth)
    .x(d3.scale.ordinal().domain(d3.range(1, 13)))
    .xUnits(dc.units.ordinal)
    .elasticY(true)
    .colors(colorDeadScale)
    .on("filtered", function (c, f) {
      return updateGraph();
    })
    .yAxis()
    .ticks(3);
  barPerWeekDay
    .width(barWk)
    .height(100)
    .margins(marginWk)
    .dimension(weekdayDim)
    .group(deathWeekDay)
    .x(d3.scale.ordinal().domain(weekDayTable))
    .xUnits(dc.units.ordinal)
    .gap(4)
    .elasticY(true)
    .colors(colorDeadScale)
    .on("filtered", function (c, f) {
      return updateGraph();
    })
    .yAxis()
    .ticks(3);
  barPerHour
    .width(barHr)
    .height(100)
    .margins(marginHr)
    .dimension(hourDim)
    .group(deathHour)
    .x(d3.scale.linear().domain([0, 24]))
    .elasticY(true)
    .colors(colorDeadScale)
    .on("filtered", function (c, f) {
      return updateGraph();
    })
    .yAxis()
    .ticks(3);
  barAcciMonth
    .width(barMt)
    .height(100)
    .margins(marginMt)
    .dimension(monthDim)
    .group(acciMonth)
    .x(d3.scale.ordinal().domain(d3.range(1, 13)))
    .xUnits(dc.units.ordinal)
    .elasticY(true)
    .colors(colorAcciScale)
    .on("filtered", function (c, f) {
      return updateGraph();
    })
    .yAxis()
    .ticks(4);
  barAcciWeekDay
    .width(barWk)
    .height(100)
    .margins(marginWk)
    .dimension(weekdayDim)
    .group(acciWeekDay)
    .x(d3.scale.ordinal().domain(weekDayTable))
    .xUnits(dc.units.ordinal)
    .elasticY(true)
    .gap(4)
    .colors(colorAcciScale)
    .on("filtered", function (c, f) {
      return updateGraph();
    })
    .yAxis()
    .ticks(4);
  barAcciHour
    .width(barHr)
    .height(100)
    .margins(marginHr)
    .dimension(hourDim)
    .group(acciHour)
    .x(d3.scale.linear().domain([0, 24]))
    .elasticY(true)
    .colors(colorAcciScale)
    .on("filtered", function (c, f) {
      return updateGraph();
    })
    .yAxis()
    .ticks(4);
  dataTable
    .dimension(dataTableDim)
    .group(function () {
      return "";
    })
    .size(20)
    .columns([
      {
        label: "日期時間",
        format: function (it) {
          return formatDateTime(it);
        },
      },
      {
        label: "地點",
        format: function (it) {
          return it.countyLocation.trim();
        },
      },
      {
        label: "天候",
        format: function (it) {
          return it.weather;
        },
      },
      {
        label: "光線",
        format: function (it) {
          return it.light;
        },
      },
      {
        label: "道路類別",
        format: function (it) {
          return it.roadCategory;
        },
      },
      {
        label: "道路型態",
        format: function (it) {
          return it.roadType;
        },
      },
      {
        label: "事故位置",
        format: function (it) {
          return it.accidentLocation;
        },
      },
      {
        label: "事故型態",
        format: function (it) {
          return it.accidentType;
        },
      },
      {
        label: "死亡",
        format: function (it) {
          return it.dead;
        },
      },
      {
        label: "受傷",
        format: function (it) {
          return it.injury;
        },
      },
    ])
    .sortBy(function (it) {
      return it.date;
    })
    .order(d3.descending)
    .showGroups(false);
  dc.renderAll();
  updateGraph();
  navls = [
    {
      ttl: "事故交叉篩選",
      txt: "這裡呈現 2012 年新竹市 A1 及 A2 類交通事故明細，共 7,922 件事故、24 起死亡。黃色代表事故，紅色代表發生死亡的事故。</br></br>（點擊此區開始導覽。）",
      act: function () {},
    },
    {
      ttl: "2012 年每月趨勢",
      txt: "黃色是事故數量，紅色是死亡。可以看到，每個月的車禍數量差不多，但 4 月的車禍死亡最少。（點擊前往「星期別」）",
      act: function () {
        return d3.selectAll(".fltWeek, .fltHour").transition().style({
          opacity: 0.2,
        });
      },
    },
    {
      ttl: "星期別",
      txt: "各星期的事故數相當平均，其中星期二、星期三的死亡最少。（點擊前往「時段」）",
      act: function () {
        d3.selectAll(".fltMonth, .fltHour").transition().style({
          opacity: 0.2,
        });
        return d3.selectAll(".fltWeek").transition().style({
          opacity: 1,
        });
      },
    },
    {
      ttl: "時段",
      txt: "一天當中，0–7 點的車禍數量很少。但以凌晨兩點為例，車禍數量很少，但死亡比例很高。</br></br>想知道這些事故在哪裡嗎？（點擊看看）",
      act: function () {
        d3.selectAll(".fltMonth, .fltWeek").transition().style({
          opacity: 0.2,
        });
        return d3.selectAll(".fltHour").transition().style({
          opacity: 1,
        });
      },
    },
    {
      ttl: "點一下就分析",
      txt: "將滑鼠拖曳選取 0–7 點，地圖會高亮對應的事故（約 1 秒內回應），週與月的圖表也會同步更新。（點擊前往「交叉篩選」）",
      act: function () {
        d3.selectAll(".filter").transition().style({
          opacity: 1,
        });
        return hourDim.filterRange([0, 8]);
      },
    },
    {
      ttl: "交叉篩選",
      txt: "也能套用多重條件，例如篩選 0–7 點且假日的事故：先拖曳時間區間，再點選週六、週日。（點擊前往「地理交叉篩選」）",
      act: function () {
        return weekdayDim.filter(["週六", "週日"]);
      },
    },
    {
      ttl: "地理交叉篩選",
      txt: "反過來也行，放大地圖任何區域，圖表會跟著更新。現在顯示的是新竹火車站周邊。（點擊切換另一個地理篩選）",
      act: function () {
        map.setView({ lat: 24.8016, lng: 120.9711 }, 14);
        return setTimeout(function () {
          return map.setZoom(15);
        }, 150);
      },
    },
    {
      ttl: "地理交叉篩選",
      txt: "我們也可以移到新竹科學園區周邊。</br></br>程式化產生的視覺化有個好處：開發一次後，只要換資料就能快速得到最新圖表。</br></br>開始自己探索吧！用左側縮放滑桿或方向箭頭，也能直接拖曳地圖在城市中移動。",
      act: function () {
        return map.setView({
          lat: 24.7795,
          lng: 121.012,
        }, 15);
      },
    },
  ];
  navidx = 0;
  (nav = function () {
    var ctn, l;
    ctn = navls[navidx];
    l = navls.length - 1;
    if (navidx > l) {
      return d3.selectAll(".ctn-nav").transition().style({
        opacity: 0,
      });
    } else {
      d3.selectAll(".navttl").text(ctn.ttl);
      d3.selectAll(".navidx").text(navidx + "/" + l);
      d3.selectAll(".navtxt").html(ctn.txt);
      return ctn.act();
    }
  })();
  return d3.selectAll(".ctn-nav").on("mousedown", function () {
    ++navidx;
    return nav();
  });
});
