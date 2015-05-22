//new version of d3canvas, to be used with chart.js
function drawChart(json_data){
	console.log("drawing chartjs visualization");

	//hiding d3 svg
	$('svg').remove();
	$('text-container').remove();
	
	//hiding table
	$('#tableid').remove();

	//appending canvas
	$('#container').append('<canvas id="myChart" width="400" height="400"></canvas>');
	
	//json = JSON.parse(json_data);

	var data = [
    	{
        	value: 300,
        	color:"#F7464A",
        	highlight: "#FF5A5E",
        	label: "Red"
    	},
    	{
        	value: 50,
        	color: "#46BFBD",
        	highlight: "#5AD3D1",
        	label: "Green"
    	},
    	{
        	value: 100,
        	color: "#FDB45C",
        	highlight: "#FFC870",
        	label: "Yellow"
    	}
	]

	var total = 0;
	var total_captioned = 0;
	var total_uncaptioned = 0;

	for (i=0; i<json_data.length; i++){
    	var child = json_data[i];

    	total_captioned += child.num_captioned;
    	total_uncaptioned += child.num_not_captioned;
    }

    total = total_captioned + total_uncaptioned;

    var data2 = [
    	{
    		value: total_uncaptioned,
    		color: "#F7464A",
    		highlight: "#FF5A5E",
    		label: "Total Uncaptioned Videos"
    	},
    	{
    		value: total_captioned,
        	color: "#FDB45C",
        	highlight: "#FFC870",
    		label: "Total Captioned Videos"
    	}
    ]

	// Get context with jQuery - using jQuery's .get() method.
	var ctx = $("#myChart").get(0).getContext("2d");
	// This will get the first returned node in the jQuery collection.
	var myNewChart = new Chart(ctx).Doughnut(data2, {animateScale : false, scaleShowLabels : true, showTooltips: true,});
		//adding responsive: true to the options makes the chart change
			//size with the window
	$('#container').fadeTo('slow', 1.0);


}