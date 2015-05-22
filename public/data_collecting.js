/* either get the desired data from the database, or from the API
if it's not in the database
*/
function getData(date, next_date){

  var DayCounts = Parse.Object.extend("DayCounts");
  var query = new Parse.Query(DayCounts);
  query.descending("num_not_captioned");
  query.equalTo("date",date);

  //query.lessThan("date",next_date);
  query.find({
    success: function(results){
      var num_results = results.length;
      console.log("Successfully checked database for date range "+date+" - "+next_date+".")
      if (num_results == 0){
        console.log("0 items match the query. Will query API instead and store data.");  
        
        // get the data, draw visualization when done and store in database
        var cat_counts = callAPIforDate(date,next_date);

        putCatCountsInDatabase(cat_counts,date);
        return cat_counts;
        
      } else {
        // got results from database.
        console.log(num_results+" items match the query.");

        var cat_counts = convertDBresultsToCatCounts(results);
        return cat_counts;

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

  var promise = $.ajax( {
    url: api_url,
    index: i,
    date: date,
    type: 'GET'
  } );

  promise.done( function( response) {
      addData(response,this.index, this.date);

      function addData(data, i, date){
        var count = parseInt(data.pageInfo.totalResults);
        console.log(count);

        if (count >= 1000000){

          console.log('Count for the datetime range '+date+' - '+next_date + 'for category ' +cat_id +' exceeded the Youtube API max return of 1 000 000. Retrying by dividing date range in half.');
          var diff = Math.abs(next_date - date);
          var half_date = new Date();
          half_date.setTime(date.getTime() + diff/2);
          num_completed['total'] += 1 // since we're adding 2 more calls

          var promise1 = singleAPICall(date, half_date, cat_id, captioned, cat_counts, i, num_completed);
          var promise2 = singleAPICall(half_date, next_date, cat_id, captioned, cat_counts, i, num_completed);

          $.when(promise1, promise2).done(function(data1, data2){
            return {
              'i' : i,
              'count' : data1['count'] + data2['count'],
              'capt_key' : data1['capt_key'] 
            }
          })

        } else {
          return {
            'i' : i,
            'count' : count,
            'capt_key' : capt_key
          }
        
        }
      }
    }
  )

  promise.fail( function (response){
      alert('Error accessing API: '+response);
    }
  );

}

function callAPIforDate(date, next_date){

  cat_counts = [];
  
  // making this a dictionary so it's passed by reference
  num_completed = { 'completed' : 0, 'total' : 2*Object.keys(clean_cats).length };

  var promises = [];

  for (var title in clean_cats){
    cat_counts.push({});
    var cat_id = clean_cats[title];
    cat_counts[i]['id'] = cat_id;
    cat_counts[i]['title'] = title;
    cat_counts[i]['num_captioned'] = 0;
    cat_counts[i]['num_not_captioned'] = 0;

    promises.push(singleAPICall(date, next_date, cat_id, true, cat_counts, i, num_completed));
    promises.push(singleAPICall(date, next_date, cat_id, false, cat_counts, i, num_completed));

  }

  Promise.all(promises).then(function(dataArr){
    dataArr.forEach(function(data){
      cat_counts[data['i']][data['capt_key']] += count;
    });

    return cat_counts;
  }).catch(function(err){
    console.log(err);
  })

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

/* important in case there are multiple dates in the results */

function convertDBresultsToCatCounts(results){
  
  console.log('database query results:');

  var cat_counts = [];
  var cc_indices = {}; // initialize a map between cat names and indices in the cat_counts array
  
  // initialize cat_counts
  for (var i=0; i<Object.keys(clean_cats).length; i++){
    var title = Object.keys(clean_cats)[i];
    cc_indices[title] = i;
    cat_counts.push({});
    cat_counts[i]['title'] = title;
    cat_counts[i]['id'] = clean_cats[title];
    cat_counts[i]['num_captioned'] = 0;
    cat_counts[i]['num_not_captioned'] = 0;
  }

  for (var i=0; i<results.length; i++){
    var result = results[i].toJSON();
    console.log(result);
    var index = cc_indices[result['cat_name']];
    cat_counts[index]['num_captioned'] += result['num_captioned'];
    cat_counts[index]['num_not_captioned'] += result['num_not_captioned'];
  }

  return cat_counts;
}