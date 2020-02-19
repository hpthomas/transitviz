var routes = null;
function drawSideMap(from, json, data, svg, routes_file) {
		// establish svg
		var width = 300;
		var height = 600;
		svg.attr("width", width)
		  .attr("height", height);
		svg.selectAll(".side_title").remove();
		/*
	    svg.append("text")
	    	.attr("class","title")
	        .attr("x", (width/2) - 20)
	        .attr("y", 25)
	        .attr("text-anchor", "middle")  
	        .style("font-size", "14px") 
	        .style("font-family", "sans-serif") 
	        .style("fill", "black") 
	        .text("Transit Time from " + from); */
	    svg.append("text")
	        .attr("x", (width/2) - 20)
	    	.attr("class","side_title")
	        .attr("y", 25)
	        .attr("text-anchor", "middle")  
	        .style("font-size", "16px") 
	        .style("font-family", "sans-serif") 
	        .style("fill", "black") 
	        .text(function(){
	          if(mode=="transit")
	            return "Transit Times from " + from;
	          else
	            return "Duration of Divvy Trips";
	        });
	    svg.append("text")
	        .attr("x", (width/2) - 20)
	        .attr("y", 45)
	    	.attr("class","side_title")
	        .attr("text-anchor", "middle")  
	        .style("font-size", "14px") 
	        .style("font-family", "sans-serif") 
	        .style("fill", "black") 
	        .text(function(){
	          if(mode=="transit")
	            return "Duration of Public Transit Trip"
	            return "Average trip from " + from;
	        });
		  //.attr("transform","translate(100,-100)");
		// projection details
		var center  = d3.geoCentroid(json);
		var scale = 50000;
		var projection = d3.geoMercator()
		  .scale(scale)
		  .center(center)
		  .translate([width/2,height/2]);

		//establish paths
		var path = d3.geoPath()
		  .projection(projection);

		//save active area to be de-colored
		var active = d3.select(null);

	    var color_domain = [1800,3600,5400,7200,9000];
	    var ext_color_domain = [0,1800,3600,5400,7200,9000];
	    var legend_labels = ["< 30m", "30m+", "1hr+", "1.5hr+", "2hr+", "> 2.5hr"];
	    var color = d3.scaleThreshold()
	      .domain(color_domain)
	      //.range(["#f1eef6","#d0d1e6","#a6bddb","#74a9cf","#2b8cbe","#045a8d"]); //blues  
		  .range(["#edf8fb","#ccece6","#99d8c9","#66c2a4","#2ca25f","#006d2c"].reverse()); //greens
	      //.range(["#d53e4f","#fc8d59","#fee08b","#e6f598", "#99d594","#3288bd"]); //diverging

		var times = {}
		//first build a dict of place : dest times
		for (var i = 0; i < data.length; i++){
			if (data[i].origin == from) {
				if (data[i].time != -1) {
					times[data[i].dest] = data[i].time;
				}
			}
		}

	    for (var j = 0; j < json.features.length; j++) {
	      var name = json.features[j].properties.community;
	      json.features[j].properties.transit_time = times[name];
	    }

		// removed .attr("class","neighborhood") bc nothing to do when clicked now
		var g = svg.append("g");
		g.selectAll("path")
		.data(json.features)
		.enter()
		.append("path")
		.attr("d", function(arg) {
			return path(arg);
		}) 
		.style("fill",function(d) {
			var time = d.properties.transit_time;
			    if (time) {
			      return color(time);
			    }
			    else {
			      return "#000";
			    }
		})
		.attr("class","neighborhood")
    	.on("click", clicked)
    	.on("mouseenter",function(data) {
	      if (active == this) return;
	      active = this;
	      var box = d3.select(this).node().getBBox();
	      var bigbox = d3.select("#side").node().getBBox();
	      tooltip.classed('hidden', false)
	          .attr('style', 'left:' + (box.x +  360) +
	              'px; top:' + (box.y) + 'px')
	          .html(getDetailHTML(data));
	    })
    	.on("mouseleave",function(d) {
			tooltip.classed("hidden",true);
    	});

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




    //tooltip var 
    var tooltip = d3.select('body').append('div')
        .attr('class', 'hidden tooltip');
    var active = null;
    function mins(secs) {
    	var s = Number(secs) / 60;
    	return s.toFixed(1);
    }
    function getDetailHTML(data) {
    	// if local_routes is empty it's divvy, not transit
    	if (Object.keys(local_routes).length != 0) {
	    	var route = local_routes[ [data.properties.community,from]  ];
	    	if (route == undefined) return "<b> no data </b>";

	     	var html =  "<b>" + from + " to <br>" +
	     	data.properties.community + "</b> <br><br>" + 
	     	mins(route.time) + " minutes via public transit <br>" +
	     	"Transfers: " + route.transfers + " <br>" + 
	     	""+mins(route.walktime) + " mins of walking required <br>";
	     	return html;
	     }
	     else {
	     	if (data.properties.transit_time) {
		     	var html =  "<b>" + from + " to <br>" +
		     	data.properties.community + "</b> <br><br>" + 
		     	"Average Divvy trip takes " + mins(data.properties.transit_time) + " mins.";
		     	return html;
		     }
		     else {
		     	return "<b>No Divvy trips from <br>"+from + " to " + data.properties.community;
		     }
	     }

    }
    var local_routes = {};
	// only tooltip for transit? or divy too
	function draw_routes() {
	    var r = json.features.reduce( (acc, feature) => {
	    	var route = routes[ [feature.properties.community,from]  ];
	    	if (route) {
	    		local_routes[ [feature.properties.community,from] ] = route;
	    		acc = acc.concat( route.legs.map(leg => leg[0]) );
	    	}
	    	return acc;	
	    }, []);

        g.append("g")
          .selectAll("path")
          .data(r)
          .enter()
          .append("path")
          .attr("d",function(route) {
          	return path(polyline.toGeoJSON(route));
          })
          .attr("class","route");
	}

	if (routes_file && routes==null) {
		d3.json(routes_file, function(error, routes_data){
			routes = routes_data;
			draw_routes();
		});
	}
	else if (routes_file) {
		draw_routes();
	}
	function clicked(d) { 
	} 
}