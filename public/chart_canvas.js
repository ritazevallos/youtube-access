//new version of d3canvas, to be used with chart.js
function drawChart(json_data){
	console.log("drawing chartjs visualization");

	//hiding d3 svg
	$('svg').remove();
	$('text-container').hide();
	
	//hiding table
	$('#tableid').remove();

	//appending canvas
	$('#container').append('<canvas id="myChart" width="400" height="400"></canvas>');
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
	// Get context with jQuery - using jQuery's .get() method.
	var ctx = $("#myChart").get(0).getContext("2d");
	// This will get the first returned node in the jQuery collection.
	var myNewChart = new Chart(ctx).Doughnut(data, {animateScale : false});



}