function drawMap(mode, svg, json, data, clicked_function) {
    var width = 300;
    var height = 600;
    svg.attr("width", width)
     .attr("height", height);

    svg.selectAll(".main_title").remove();
    svg.append("text")
        .attr("x", (width/2) - 20)
        .attr("y", 25)
        .attr("class","main_title")
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .style("font-family", "sans-serif") 
        .style("fill", "black") 
        .text(function(){
          if(mode=="transit")
            return "Chicago: Bus/Train Usage Rate";
          else
            return "Chicago: Divvy Usage Rate";
        });
    svg.append("text")
        .attr("x", (width/2) - 20)
        .attr("y", 45)
        .attr("class","main_title")
        .attr("text-anchor", "middle")  
        .style("font-size", "14px") 
        .style("font-family", "sans-serif") 
        .style("fill", "black") 
        .text(function(){
          if(mode=="transit")
            return "Boardings per Person per Day";
          else
            return "Bike Uses per Person: Q4 2018";
        });

    // projection details
    var center  = d3.geoCentroid(json);
    var scale = 50000;
    var projection = d3.geoMercator()
        .scale(scale)
        .center(center)
        .translate([width/2,height/2]); // TODO what is this doing?

    var color_domain = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
    var ext_color_domain = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]; 
    var legend_labels = ext_color_domain.map(n=>""+n);
    var color_range = ['#ffffd9','#edf8b1','#c7e9b4','#7fcdbb','#41b6c4','#1d91c0','#225ea8','#253494','#081d58'];
    if (false) { //old color pallettes
      color_domain = [0.5, 1, 1.5, 2, 2.5];
      color_range = ['#ffffcc','#c7e9b4','#7fcdbb','#41b6c4','#2c7fb8','#253494'];// blue 
      //color_range = ["#f1eef6","#d0d1e6","#a6bddb","#74a9cf","#2b8cbe","#045a8d"] // blue
      //color_range = ["#edf8fb","#ccece6","#99d8c9","#66c2a4","#2ca25f","#006d2c"]//old green
      //color_range = ['#762a83','#af8dc3','#e7d4e8','#d9f0d3','#7fbf7b','#1b7837']// diverging purple-green
      //color_range = ['#fee5d9','#fcbba1','#fc9272','#fb6a4a','#de2d26','#a50f15']// red heatmap
      ext_color_domain = [0, 0.5, 1, 1.5, 2, 2.5];
      legend_labels = ["< .5", ".5+", "1+", "1.5+", "2+", "> 2.5"];
    }
    var color = d3.scaleThreshold()
      .domain(color_domain)
      .range(color_range);
    //establish paths
    var path = d3.geoPath()
        .projection(projection);

    //var color = d3.scaleSequential(d3.interpolate("white", "green"))
    //color = d3.scaleSequential(d3.interpolateGreens).domain([0,3]);

    var times = data;
    //first build a dict of place : dest times
    for (var i = 0; false && i < data.length; i++){
      if (data[i].origin == "LOOP") {
        if (data[i].time != -1) {
          times[data[i].dest] = data[i].time;
        }
      }
    }

    for (var j = 0; j < json.features.length; j++) {
      var name = json.features[j].properties.community;
      var num = times[name];
      var pop = json.features[j].properties.population;
      var per_capita = num / pop;
      json.features[j].properties.val = per_capita;
      /*
      console.log(json.features[j]);
      console.log("" + num + "   /    " + pop  + "   =" + per_capita);
      console.log(per_capita);
      */
    }
    //tooltip var 
    var tooltip = d3.select('body').append('div')
        .attr('class', 'hidden tooltip');
    var active = null;
    var g = svg.append("g");
      g.selectAll("path")
      .data(json.features)
      .enter()
      .append("path")
      .attr("d", path) 
      .attr("class","neighborhood")
      .style("fill",function(d) {
        var time = d.properties.val;
            if (time) {
              return color(time);
            }
            else {
              if (d.properties.community == "LOOP") return "#fff";
              else return "#000"; // TODO change this - black means both 'home neighborhood' and 'no data'
            }
      })
      .on("click", clicked)
      .on('mouseenter', function (d) {
          if (active == this) return;
          active = this;

          var mouse = d3.mouse(this).map(function (d) {
              return parseInt(d);
          });
          var unit = mode=="transit"? " entries per day" : " uses per capita";
          tooltip.classed('hidden', false)
              .attr('style', 'left:' + (mouse[0] + 25)  +
                  'px; top:' + (mouse[1]) + 'px')
              .html('<b>' + d.properties.community + "<br>" 
                + d.properties.val.toFixed(2) + unit + " <br>" + '</b>' + '<br>' +
              '% of housing crowded: ' + d.properties.HousingCrowded + '%' + '<br>' +
              '% below poverty line: ' + d.properties.BelowPoverty + '%' + '<br>' +
              '% aged 16+ unemployed: ' + d.properties.Unemployed + '%' + '<br>' +
              '% aged 25+ w/o high school diploma: ' + d.properties.HighSchoolDiploma + '%' + '<br>' +
              '% aged under 18 or over 64: ' + d.properties.Under18Over64 + '%' + '<br>' +
              'Per capita income: ' + '$' + d.properties.PerCapitaIncome);
        })
      .on("mouseleave",()=>tooltip.classed("hidden",true));

      var legend = svg.selectAll("g.legend")
      .data(ext_color_domain)
      .enter().append("g")
      .attr("class", "legend");

      var ls_w = 20, ls_h = 20;
      var start = 300;
      legend.append("rect")
      .attr("x", 240)
      .attr("y", function(d, i){ return start - (i*ls_h) - 2*ls_h;})
      .attr("width", ls_w)
      .attr("height", ls_h)
      .style("fill", function(d, i) { return color(d); })
      .style("opacity", 0.8);

      legend.append("text")
      .attr("x", 270)
      .attr("y", function(d, i){ return (start) - (i*ls_h) - ls_h - 4;})
      .text(function(d, i){ return legend_labels[i]; });





    function clicked(d) { 
      d3.selectAll(".neighborhood").classed("active",false);
      d3.select(this).classed("active",true);
      clicked_function(d);
    } 

}



      /* Zoom code from clicked() in demo if needed 
      if (active.node() == this) return reset();
      active.classed("active",false); // remove previous active (only color 1 area)
      active = d3.select(this).classed("active",true);

      var bounds = path.bounds(d),
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale = .9 / Math.max(dx / width, dy / height),
      translate = [width / 2 - scale * x, height / 2 - scale * y];
      g.transition()
          .duration(750)
          .style("stroke-width", 1.5 / scale + "px")
          .attr("transform", "translate(" + translate + ")scale(" + scale + ")");
    } 


    function reset() {
      a = false;
      active.classed("active", false);
      active = d3.select(null); 

      g.transition()
          .duration(750)
          .style("stroke-width", "1.5px")
          .attr("transform", "");

          */
