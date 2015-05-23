/* assume only for one day? */
function drawTable(cat_counts){

  $('#tableid').remove();
  $('#buttons').hide();

  $('svg').remove();
  $('#text-container').hide();

	$('#myChart').remove();


	var include_counts = false;

	var $table = $('<table></table>')
		.addClass('table')
		.addClass('table-condensed')
		.addClass('table-responsive')
		.addClass('table-hover')
		.attr('id', 'tableid')
  $table
    .append("<center><caption><h2>Percent Captioned Videos By Category</h2></caption></center>")
    .append("<tr><th scope='col'>Category</th><th scope='col'>% Captioned</th></tr>");


  // if (include_counts){
  //  $table
  //    .append("<th scope='col'>Captioned</th>")
  //    .append("<th scope='col'>Not Captioned</th>");
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







/* convertCatCountsToD3 - 
    Transforms a dictionary of the form

      [ 
        {
          'id': 1,
          'title': 'Animation',
          'num_captioned': '14',
          'num_not_captioned': '20'
        },
        ...
      ]

    into a JSON object of the form
      
      {
        "name":"flare",
        "children": [
          {
            "name":"Film & Animation",
            "children":[
              {
                "name":"with annotations",
                "size":590
              },
              {
                "name":"without annotations",
                "size":5579
              }
            ]
          },
          ...
        ]
      }
*/
function convertCatCountsToD3(cat_counts){
  d3_dict = {};
  d3_dict['name']='flare';
  d3_dict['children'] = [];
  for (i=0; i<cat_counts.length; i++){
    cat = cat_counts[i];
    item = {
      'name': cat['title']
    };
    item['children'] = [ 
      {
        'name': 'with annotations',
        'size': cat['num_captioned']
      },
      {
        'name': 'without annotations',
        'size': cat['num_not_captioned']
      }
    ]
    d3_dict['children'].push(item);
  }
  return JSON.stringify(d3_dict);
}