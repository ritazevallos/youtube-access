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

	



}