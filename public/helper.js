/* assume only for one day? */
function drawTable(cat_counts){

	$('svg').remove();
	$('text-container').hide();

	var include_counts = false;

	var $table = $('<table></table>')
		.addClass('table')
		.addClass('table-condensed')
		.addClass('table-responsive')
		.addClass('table-hover');

	$table
		.append("<center><caption><h2>Percent Captioned Videos By Category</h2></caption></center>")
		.append("<tr><th scope='col'>Category</th><th scope='col'>% Captioned</th></tr>");


	// if (include_counts){
	// 	$table
	// 		.append("<th scope='col'>Captioned</th>")
	// 		.append("<th scope='col'>Not Captioned</th>");
	// }

	var total_captioned = 0;
	var total = 0;

	for (var i=0; i<cat_counts.length; i++){
		cat = cat_counts[i];
		cat_name = cat['title'];
		num_captioned = cat['num_captioned'];
		num_not_captioned = cat['num_not_captioned'];
		total += num_captioned + num_not_captioned;
		total_captioned += num_captioned;

		var percentage = 0;
		if (num_not_captioned > 0){
		    percentage = (num_captioned/(num_captioned+num_not_captioned)*100).toFixed(1);
	    }

	    var $row = $("<tr></tr>")
	    	.append("<td scope='row'>"+cat_name+"</td>");

	    $row.append("<td>"+percentage+" %</td>");
	    $table.append($row);

	    if (include_counts){
	    	$row.append("<td>"+num_captioned+"</td><td>"+num_not_captioned+"</td>");
	    }

	}

	var total_percentage = (total_captioned/total*100).toFixed(1);
	$table.append("<tr class='info'><td><b>Total</b></td><td><b>"+total_percentage+" %</b></td></tr>");

	$('#container').append($table);
    $('#container').fadeTo('slow', 1.0);
}