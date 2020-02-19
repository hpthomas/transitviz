var bounds = null;
var divvy_points = null;
var transit_points = null;
var mode = null;
var train_boardings;
function drawBar() {
  var data = d3.csvParse(censusData, function(d) {
        return d;
      });
  data.forEach(function(row,i){ 
        data[i]["PERCENT HOUSEHOLDS BELOW POVERTY"]=data[i]["PERCENT HOUSEHOLDS BELOW POVERTY"]/20;
      });
  data.sort(function(a,b){return d3.ascending(a["PERCENT HOUSEHOLDS BELOW POVERTY"], b["PERCENT HOUSEHOLDS BELOW POVERTY"])});
  var newBCObject = BarChartVis();
  newBCObject.drawBarChart(data);

  newBCObject.dispatch.on("selected",
  function(selectedArea){       
      d3.select(main)
      .selectAll("path")
      .classed("active",d=>{
        if (selectedArea["COMMUNITY AREA NAME"].toUpperCase() == d.properties.community) {
          if (mode=="cycle"){
             d3.csv("divvy_cross_points.csv",function(divvy_points){
                drawSideMap(d.properties.community, bounds, divvy_points, d3.select(side),null);
             });
          }
          if (mode=="transit"){
             d3.csv("annotatedCrossPoints.csv",function(times){
                drawSideMap(d.properties.community, bounds, times, d3.select(side),"routes.json");
             });
          }
          return true;
        }
      });
  });
}

function highlightBar(clickedArea){
    var svg = d3.select("#barChart");
    var bars = svg.selectAll(".bar")
      .classed("bar",true)
      .classed("barHighlighted",d => {
            return clickedArea.properties.community == d["COMMUNITY AREA NAME"].toUpperCase();
        });
    $('.barHighlighted')[0].parentElement.scrollIntoView({behavior:"smooth"});
}
// callback is f(area_bounds, times, train, bus, divvy) 
function fetch_data(f) {
  d3.json("comm.json", function(error, area_bounds) {
    d3.json("train_boardings_weekday.json",function(train){
      d3.json("bus_boardings.json",function(bus){
        d3.csv("annotatedCrossPoints.csv",function(times){
          d3.csv("divvy_cross_points.csv",function(divvy_points){
            d3.json("divvyOrigins.json", function(divvy_origins) {
              bounds = area_bounds;
              transit_points = times;
              train_boardings = train;
              divvy_points = divvy_points;
              divvy_origins = divvy_origins;
              f(area_bounds, times, train, bus, divvy_points, divvy_origins);

            });
          });
        });
      });
    });
  });
}
function cycleClicked() {
  mode = "cycle";
  d3.select(side).selectAll("*").remove();
  fetch_data(function(area_bounds, times, train, bus, divvy_points, divvy_origins){
    drawMap(mode, d3.select(main), area_bounds, divvy_origins, function(area) {
      var name = area.properties.community;
      drawSideMap(name, area_bounds, divvy_points, d3.select(side), null);
      highlightBar(area);
    })
  });
}

function transitClicked() {
  mode = "transit";
  d3.select(side).selectAll("*").remove();
  fetch_data(function(area_bounds, times, train, bus, divvy_points, divvy_origins){
      var combined = {};
      for (var bus_area in bus) {
        combined[bus_area] = Number(bus[bus_area]);
      }
      for (var train_area in train) {
        if (combined[train_area] != undefined) {
          combined[train_area] += Number(train[train_area]);
        }
        else {
          combined[train_area] = Number(train[train_area]);
        }
      }
      drawMap(mode, d3.select(main), area_bounds, combined, function(area) {
        var name = area.properties.community;
        drawSideMap(name, area_bounds, times, d3.select(side), "routes.json");
        highlightBar(area);
      });
  });
}
drawBar();
