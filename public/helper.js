/* assume only for one day? */
function drawTable(cat_counts){

  $('#tableid').remove();
  $('#buttons').hide();

  $('svg').remove();
  $('#text-container').hide();

	$('#myChart').remove();

	var include_counts = true;

	var $table = $('<table style="margin-left:20em"></table>')
		.addClass('table')
		.addClass('table-condensed')
		.addClass('table-responsive')
		.addClass('table-hover')
		.attr('id', 'tableid');

  var $table_body = $('<tbody></tbody>');
  $table.append($table_body); 

  var top_row_str = "<tr><th scope='col'>Category</th>";

  if (include_counts){
    top_row_str += "<th scope='col'>Captioned</th>";
    top_row_str +="<th scope='col'>Not Captioned</th>";
  }

  top_row_str += "<th scope='col'>% Captioned</th>";

  top_row_str+=("</tr>");

  $table_body
    .append(top_row_str);

  var total_captioned = 0.0;
  var total = 0.0;

  for (var i=0; i<cat_counts.length; i++){
    cat = cat_counts[i];
    cat_name = cat['title'];
    num_captioned = cat['num_captioned'];
    num_not_captioned = cat['num_not_captioned'];

    if (num_captioned == 0 && num_not_captioned == 0){
      continue;
    }

    total += num_captioned + num_not_captioned;
    total_captioned += num_captioned;

    var percentage = 0.0;
    if (num_captioned > 0){
        percentage = (num_captioned/(num_captioned+num_not_captioned)*100).toFixed(1);
      }

      var $row = $("<tr></tr>")
        .append("<td scope='row'>"+cat_name+"</td>");


      if (include_counts){
        $row.append("<td>"+num_captioned+"</td><td>"+num_not_captioned+"</td>");
      }

      $row.append("<td>"+percentage+" %</td>");
      $table_body.append($row);


  }

  var total_percentage = (total_captioned/total*100).toFixed(1);
  var total_uncaptioned = total - total_captioned;
  var last_row_str = "<tr class='info'><td><b>Total</b></td>";

  if (include_counts){
    last_row_str += "<td>"+total_captioned+"</td><td>"+total_uncaptioned+"</td>";
  }

  last_row_str += "<td><b>"+total_percentage+" %</b></td></tr>";

  $table_body.append(last_row_str);

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