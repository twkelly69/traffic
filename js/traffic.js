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
  updateGraph;
colorDead = "#de2d26";
colorAcci = "rgb(255, 204, 0)";
colorDeadScale = d3.scale.ordinal().range([colorDead]);
colorAcciScale = d3.scale.ordinal().range([colorAcci]);
lngDim = null;
latDim = null;
weekDayTable = ["Sun.", "Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat."];
gPrints = null;
monthDim = null;
weekdayDim = null;
hourDim = null;
map = null;
barAcciHour = null;
initMap = function () {
  map = L.map("map", {
    center: [25.037583, 121.5637],
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
d3.tsv("./accidentXY_light.tsv", function (err, tsvBody) {
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
    d.date = new Date(d["年"], d["月"], d["日"], d["時"], d["分"]);
    d.week = weekDayTable[d.date.getDay()];
    d.dead = +d["2-30"] + +d["死"];
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
  dc.renderAll();
  updateGraph();
  navls = [
    {
      ttl: "Accident Crossfilter",
      txt: "Accidents from Taipei City in 2024 (113年) are visualized here – a total of 51,810 reported cases and 223 deaths. Orange represents all accidents, and red are accidents where death occurred. </br></br>(Click here to start navigation.)",
      act: function () {},
    },
    {
      ttl: "Death by Month – 2024",
      txt: "Monthly statistics for Taipei: orange represents accidents, and red shows accidents involving death. Use the bars to focus on specific months. (Click here for Day of the Week)",
      act: function () {
        return d3.selectAll(".fltWeek, .fltHour").transition().style({
          opacity: 0.2,
        });
      },
    },
    {
      ttl: "Day of the Week",
      txt: "Accidents on days of the week can be compared here; click any bar to filter the map and other charts. (Click here for Hour of the Day)",
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
      ttl: "Hour of the Day",
      txt: "Compare how activity and severity shift over the 24-hour day. Late-night and early-morning crashes can be isolated by brushing the chart.</br></br>This is interesting, but where exactly are these accidents? (Click here to find out)",
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
      ttl: "Analysis with a Click",
      txt: "If you drag your mouse from 0 am to 7 am, the accidents in that window are highlighted on the map. Notice that the week and month charts are updated according to your action. (Click here for Crossfilter)",
      act: function () {
        d3.selectAll(".filter").transition().style({
          opacity: 1,
        });
        return hourDim.filter([0, 8]);
      },
    },
    {
      ttl: "Crossfilter",
      txt: "You can also select multiple criteria, such as the accidents that happened from 0 am to 7 am on weekends. For these criteria, drag your mouse for the timeframe and then click on Saturday and Sunday. (Click here for Geo-Crossfilter)",
      act: function () {
        return weekdayDim.filter(["Sat.", "Sun."]);
      },
    },
    {
      ttl: "Geo-Crossfilter",
      txt: "This also works the other way: zoom into any part of the map and the charts will update accordingly. Now we are viewing the area around Taipei Main Station. (Click here for another Geo-Crossfilter)",
      act: function () {
        map.setView({ lat: 25.047675, lng: 121.517055 }, 14);
        return setTimeout(function () {
          return map.setZoom(15);
        }, 150);
      },
    },
    {
      ttl: "Geo-Crossfilter",
      txt: "Now we’re around Taipei 101.</br></br>The benefit of programming-generated visualization is that once developed, we just feed in different data to generate an up-to-date graph.</br></br>Start exploring on your own! Zoom in and out using the controls, or drag the map itself from one part of the city to another.",
      act: function () {
        return map.panTo({
          lat: 25.033968,
          lng: 121.564468,
        });
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
