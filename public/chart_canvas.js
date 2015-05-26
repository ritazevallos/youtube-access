//new version of d3canvas, to be used with chart.js
function drawChart(json_data, category){
	console.log("drawing chartjs visualization");

    $('#myChart').remove();

	//hiding d3 svg
	$('svg').remove();
	//$('text-container').remove();
    $('#text-container').show();
    $('#buttons').show();
	
	//hiding table
	$('#tableid').remove();

	//appending canvas
	$('#container').append('<canvas id="myChart" width="400" height="400"></canvas>');
	
	//json = JSON.parse(json_data);

	var total = 0;
	var total_captioned = 0;
	var total_uncaptioned = 0;

	for (i=0; i<json_data.length; i++){
    	var child = json_data[i];
        if(category === "All"){
    	   total_captioned += child.num_captioned;
    	   total_uncaptioned += child.num_not_captioned;
        }else if(child.title === category){
            total_captioned += child.num_captioned;
            total_uncaptioned += child.num_not_captioned;
        }
    }

    total = total_captioned + total_uncaptioned;

    var data = [
    	{
    		value: total_uncaptioned,
    		color: "#00A1F4",
    		highlight: "#FF5A5E",
    		label: "Total Uncaptioned Videos"
    	},
    	{
    		value: total_captioned,
        	color: "#E50000",
        	highlight: "#FFC870",
    		label: "Total Captioned Videos"
    	}
    ]

	// Get context with jQuery - using jQuery's .get() method.
	var ctx = $("#myChart").get(0).getContext("2d");
	// This will get the first returned node in the jQuery collection.
	var myNewChart = new Chart(ctx).Doughnut(data, {animateScale : false, scaleShowLabels : true, showTooltips: true, animateRotate : false});
		//adding responsive: true to the options makes the chart change
			//size with the window
    changeCenterText(category, total_captioned, total);
	$('#container').fadeTo('slow', 1.0);

}

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
