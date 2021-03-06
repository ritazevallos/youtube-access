/* Make buttons for each category */
function addButtons(cat_counts){
	$('.cat_button').remove();

	addButton("All");

	for(i=0; i<cat_counts.length; i++){

		var cat = cat_counts[i];
		cat_name = cat['title'];

		if(cat['num_captioned'] == 0 && cat['num_not_captioned'] == 0){
			continue;
		}

		addButton(cat_name);

	}
}

function addButton(cat_name){
	var $button = $('<button></button>')
		.addClass('cat_button')
		.addClass('btn')
		.addClass('btn-default')
		.addClass('btn-sm')
		.addClass('btn-block')
		.attr('id', 'buttonid')
		.data('cat_name',cat_name);

	$button
		.append(cat_name);

	$('#buttons').append($button);
}