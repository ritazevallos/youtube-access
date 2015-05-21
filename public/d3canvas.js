function drawVisualization(json_data, width, height){
  console.log('drawing d3 visualization');

  var radius = Math.min(width, height) / 2.1;

  var x = d3.scale.linear()
      .range([0, 2 * Math.PI]);

  var y = d3.scale.linear()
      .range([0, radius]);

  var color = d3.scale.category20c();

  // var color = d3.scale.linear()
  //     .domain([0,40])
  //     .range(["yellow", "cyan"]);


  d3.select('svg').remove();
  d3.select('table').remove();
  var svg = d3.select("#container").append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", "translate(" + width / 2 + "," + (height / 2 + 10) + ")");

  var partition = d3.layout.partition()
      .value(function(d) { return d.size; });

  var arc = d3.svg.arc()
      .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
      .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
      .innerRadius(function(d) { return Math.max(0, y(d.y)); })
      .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });

  //d3.json("dummy.json", function(error, root) {

    root = JSON.parse(json_data);

    var g = svg.selectAll("g")
        .data(partition.nodes(root))
      .enter().append("g");
    
    $('#container').fadeTo('slow', 1.0);

    var total_vids = root.value;
    var idx = 0;

    var path = g.append("path")
      .attr("d", arc)
      //.style("fill", function(d) { return color((d.children ? d : d.parent).name); })
      .attr("fill", function (d) {
        //debugger; 
        //console.log((parseInt(color(d.value).substring(1,7),16)).toString(16));
        if (d.name === "flare") return "#ffffff"; 
        // else if (d.name === "with annotations") return ("#"+(parseInt(color(d.parent.value).substring(1,7),16) + 6000).toString(16));
        // else if (d.name === "without annotations") return ("#"+(parseInt(color(d.parent.value).substring(1,7),16) - 6000).toString(16));
        else if (d.name === "with annotations") return color(d.parent.value/total_vids*90);
        else if (d.name === "without annotations") return color(d.parent.value/total_vids*90);
        else {
          return color(d.value/total_vids*90);}
          ;})
        // else if (d.name === "with annotations") return color(3*idx+10);
        // else if (d.name === "without annotations") return color(3*idx);
        // else {
        //   idx++;
        //   return color(3*idx+5);}
        //   ;})
      .style("opacity", function(d){ 
        if (d.name === "without annotations") return 0.33;
        if (d.name === "with annotations") return 0.66;
        else return 1;
      })
      .on("click", click);
      //.attr("display", function(d) { return d.depth ? null : "none"; });

    absolute_total = root.value;

    absolute_total_captioned = 0.0;
    for (i=0; i<root.children.length; i++){
      child = root.children[i];

      if (child.children[0].name === "with annotations"){
        absolute_total_captioned += child.children[0].value;
      }
      else {absolute_total_captioned += child.children[1].value;}
    }

    changeCenterText("", absolute_total_captioned, absolute_total);

    var text = g.append("text")
      .attr("transform", function(d) { 
        //console.log(computeTextRotation(d));
        if (d.name === "flare") return null;
        else return "rotate(" + computeTextRotation(d) + ")"; })
      .attr("x", function(d) {
        if (d.name === "flare") return -103;
        else return y(d.y); })
      .attr("dx", "6") // margin
      .attr("dy", ".35em") // vertical-align
      .text(function(d) { 
        if (d.name === "flare") return "";
        else if (d.depth > 1) return ""; 
        else return d.name; });

    function changeCenterText(nameString, total_captioned, total){
      var percentageString = String((total_captioned/total*100).toFixed(1))+"\%";

      d3.select("#percentage")
        .text(percentageString);

      d3.select('#genre_name')
        .text(nameString);

      d3.select("#explanation")
          .style("visibility", "");

      // var alt_text = "%s of %s videos on Youtube are accessible*"%(percentageString, nameString);

      var alt_text = percentageString + " of " + nameString + " videos on Youtube are accessible";

      console.log(alt_text); 
      d3.select('#alt_chart_image').attr('alt',alt_text);
    }

    function click(d) {
      // todo: calculate percentage
      alert('in click!');

      if (d.name === "flare"){
        changeCenterText("", absolute_total_captioned, absolute_total);
      } else {

        var total_genre = d.value;

        if (!d.children){
            d=d.parent;
            total_genre = d.value;
        }
        if (d.children[0].name === "with annotations"){
            var total_captioned = d.children[0].value;
        }
        else {var total_captioned = d.children[1].value;};

        changeCenterText(d.name, total_captioned, total_genre);
      }

      // fade out all text elements
      text.transition().attr("opacity", 0);

      path.transition()
        .duration(750)
        .attrTween("d", arcTween(d))
        .each("end", function(e, i) {
            // check if the animated element's data e lies within the visible angle span given in d
            if (e.x >= d.x && e.x < (d.x + d.dx)) {
              // get a selection of the associated text element
              var arcText = d3.select(this.parentNode).select("text");
              // fade in the text element and recalculate positions
              arcText.transition().duration(750)
                .attr("opacity", 1)
                .attr("transform", function() { return "rotate(" + computeTextRotation(e) + ")" })
                // .attr("transform", function() { 
                //   if(e.name != "flare"){
                //     return ("rotate(" + 0 + ")");
                //   }
                //   else {
                //     return ("rotate(" + computeTextRotation(e) + ")");
                //   }
                // })
                .attr("x", function(d) { return y(d.y); });
            }
        });
    }
  //});

  d3.select(self.frameElement).style("height", height + "px");

  // Interpolate the scales!
  function arcTween(d) {
    var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
        yd = d3.interpolate(y.domain(), [d.y, 1]),
        yr = d3.interpolate(y.range(), [d.y ? 150 : 0, radius]);
    return function(d, i) {
      return i
          ? function(t) { return arc(d); }
          : function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
    };
  }

  function computeTextRotation(d) {
    return (x(d.x + d.dx / 2) - Math.PI / 2) / Math.PI * 180;
}

}