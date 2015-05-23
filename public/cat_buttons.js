/* Make buttons for each category */
function addButtons(cat_counts){
	noButtons = false;
	for(i=0; i<cat_counts.length; i++){

		var cat = cat_counts[i];
		cat_name = cat['title'];

		console.log(cat_name);

		if(cat['num_captioned'] == 0 && cat['num_not_captioned'] == 0){
			continue;
		}

    	var $button = $('<button></button>')
    		.addClass('button')
    		.attr('id', 'buttonid')
    		.attr('onclick', 'drawChart(cat_counts, cat_name)')
    	$button
    		.append(cat_name);

    	$('#buttons').append($button);

	}
}