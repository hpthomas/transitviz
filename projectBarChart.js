var BarChartVis = function(){
  var newBC ={
      drawBarChart : function(data){
        var margin = {top: 15, right: 50, bottom: 25,left: 115};

        var width = 600 - margin.left - margin.right,
            height = 1400 - margin.top - margin.bottom;

        var svg = d3.select("#barChart")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        console.log(svg);
        svg.append("text")
            .attr("x", (width/2) - 30)
            .attr("y", -3)
            .attr("text-anchor", "middle")  
            .style("font-size", "16px") 
            .style("font-family", "sans-serif") 
            .style("fill", "black") 
            .text("Poverty Rate by Neighborhood");

        var x = d3.scaleLinear()
            .range([0, width])
            .domain([0, d3.max(data, function (d) {
                return d["PERCENT HOUSEHOLDS BELOW POVERTY"];
            })]);
        var y = d3.scaleBand()
            .range([height, 0])
            .domain(data.map(function (d) {
                return d["COMMUNITY AREA NAME"];
            }))
            .padding(0.1);

    // Scale the range of the data in the domains
          x.domain([0, d3.max(data, function(d) { return d["PERCENT HOUSEHOLDS BELOW POVERTY"]; })]);
          y.domain(data.map(function(d) { return d["COMMUNITY AREA NAME"]; }));
    // add the x Axis
          svg.append("g")
              .attr("transform", "translate(0," + height + ")")
              .call(d3.axisBottom(x));

          // add the y Axis
          svg.append("g")
              .call(d3.axisLeft(y));

            var bars = svg.selectAll(".bar")
                .data(data)
                .enter()
                .append("g")

            //append rects
            bars.append("rect")
                .attr("class", "bar")
                .attr("y", function (d) {
                    return y(d["COMMUNITY AREA NAME"]);
                })
                .attr("height",y.bandwidth())
                .attr("x", 0)
                .attr("width", function (d) {
                    return x(d["PERCENT HOUSEHOLDS BELOW POVERTY"]);
                })
                 .on("click", function(d) {
                    $(".barHighlighted").removeClass("barHighlighted").addClass("bar");
                     $(this).addClass("barHighlighted")
                     newBC.dispatch.call("selected", {}, d);});

            //add a value label to the right of each bar
            bars.append("text")
                .attr("class", "label")
                //y position of the label is halfway down the bar
                .attr("y", function (d) {
                    return y(d["COMMUNITY AREA NAME"]) + y.bandwidth() / 2 + 4;
                })
                //x position is 3 pixels to the right of the bar
                .attr("x", function (d) {
                    return x(d["PERCENT HOUSEHOLDS BELOW POVERTY"]) + 2;
                })
                .text(function (d) {
                    return parseFloat(d["PERCENT HOUSEHOLDS BELOW POVERTY"]*20).toFixed(2);;
                });
            bars.append("text")
                .attr("class", "label")
      },
       dispatch: d3.dispatch("selected")
    };
    return newBC;
}