/* either get the desired data from the database, or from the API
if it's not in the database
*/
function getData(date, next_date, display_type){

  var DayCounts = Parse.Object.extend("DayCounts");
  var query = new Parse.Query(DayCounts);
  query.descending("num_not_captioned");
  query.equalTo("date",date);

  //query.lessThan("date",next_date);
  query.find({
    success: function(results){
      var count = results.length;
      console.log("Successfully checked database for date range "+date+" - "+next_date+".")
      if (count == 0){
        console.log("0 items match the query. Will query API instead and store data.");  
        
        // get the data, draw visualization when done and store in database
        callAPIforDate(date,next_date);
        
      } else {
        // got results from database.
        console.log(count+" items match the query.");

        if (display_type == "d3graph"){
          var d3_json = convertDatabaseResultsToD3(results); 
          drawVisualization(d3_json, 700, 500);
        } else if (display_type == "table"){
          drawTable(results);
        } else {
          alert('Error in getData: display_type not of valid form [d3graph, table]');
        }

      }
    },
    error: function(error){
      alert("Error: " + error.code + " " + error.message);
    }
  });
}

function putCatCountsInDatabase(cat_counts,date){
  console.log('Storing in database.')
  for (var i=0; i<cat_counts.length; i++){
    // eventually just put this into the code when we're making cat_counts, since it should only be
    // called when it is a new date

    cat_dict = cat_counts[i];
    var DayCounts = Parse.Object.extend("DayCounts");
    var catDayCounts = new DayCounts();

    catDayCounts.set('cat_name',cat_dict['title']);
    catDayCounts.set('cat_id',parseInt(cat_dict['id']));
    catDayCounts.set('num_captioned',parseInt(cat_dict['num_captioned']));
    catDayCounts.set('num_not_captioned',parseInt(cat_dict['num_not_captioned']));
    catDayCounts.set('date',date);
    console.log('Stored '+i+'of '+cat_counts.length+': ');
    console.log(catDayCounts.toJSON());
    catDayCounts.save();
  }
}

function updateAfterAPICall(cat_counts, date){

  // display data
  var d3_json = convertAPIResultsForD3(cat_counts);
  drawVisualization(d3_json, 700, 500);

  putCatCountsInDatabase(cat_counts,date)
  
}

/* cat_counts is passed by reference */
function singleAPICall(date, next_date, cat_id, captioned, cat_counts, i, num_completed){

  var capt_str, capt_key;
  if (captioned){
    capt_str = "closedcaption";
    capt_key = "num_captioned";
  } else {
    capt_str = "none";
    capt_key = "num_not_captioned";
  }

  var api_url = "https://www.googleapis.com/youtube/v3/search?publishedAfter="+
    date.toJSON() + "&publishedBefore="+next_date.toJSON() +
    "&order=date&part=id&videoCaption="+capt_str+
    "&type=video&videoCategoryId="+cat_id+
    "&maxResults=0&key=AIzaSyA2qExhE65k0s4SCHl2wwcCWyPdgtoTyFg";

  $.ajax( {
    url: api_url,
    index: i,
    date: date,
    type: 'GET',
    success: function( response) {
      addData(response,this.index, this.date);

      function addData(data, i, date){
        count = parseInt(data.pageInfo.totalResults);
        console.log(count);

        if (count >= 1000000){

          console.log('Count for the datetime range '+date+' - '+next_date + 'for category ' +cat_id +' exceeded the Youtube API max return of 1 000 000. Retrying by dividing date range in half.');
          var diff = Math.abs(next_date - date);
          var half_date = new Date();
          half_date.setTime(date.getTime() + diff/2);
          num_completed['total'] += 1 // since we're adding 2 more calls

          singleAPICall(date, half_date, cat_id, captioned, cat_counts, i, num_completed);
          singleAPICall(half_date, next_date, cat_id, captioned, cat_counts, i, num_completed);

        } else {

          cat_counts[i][capt_key] += count;// += in case we had to split in two
          num_completed['completed'] += 1;
          if (num_completed['completed'] >= num_completed['total']){
            updateAfterAPICall(cat_counts, date);
          }
        }
      }
    },
    error: function (response){
      alert('Error accessing API!');
    }
  } );

  return 1; // for counting the number completed
}

function callAPIforDate(date, next_date){

  cat_counts = [];
  
  // making this a dictionary so it's passed by reference
  num_completed = { 'completed' : 0, 'total' : 2*clean_cats.length };

  for (var i=0;i<clean_cats.length;i++){
    cat_counts.push({});
    var cat_id = clean_cats[i]['id'];
    cat_counts[i]['id'] = cat_id;
    cat_counts[i]['title'] = clean_cats[i]['title'];
    cat_counts[i]['num_captioned'] = 0;
    cat_counts[i]['num_not_captioned'] = 0;

    singleAPICall(date, next_date, cat_id, true, cat_counts, i, num_completed)
    singleAPICall(date, next_date, cat_id, false, cat_counts, i, num_completed)

  }

}

/* convertAPIResultsForD3 - 
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
function convertAPIResultsForD3(cat_counts){
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


function convertDatabaseResultsToD3(results){ 
  //todo: ASSUMING SINGLE DATE
  d3_dict = {};
  d3_dict['name']='flare';
  d3_dict['children'] = [];
  
  console.log('database query results:');
  for (i=0; i<results.length; i++){

    cat = results[i].toJSON();
    console.log(cat);

    item = {
      'name': cat['cat_name']
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

  console.log('todo: verify that we are still showing the correct date');

  return JSON.stringify(d3_dict);

}