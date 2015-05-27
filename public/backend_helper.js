/* important in case there are multiple dates in the results */
function convertDBresultsToCatCounts(results){
  

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
    var index = cc_indices[result['cat_name']];
    cat_counts[index]['num_captioned'] += result['num_captioned'];
    cat_counts[index]['num_not_captioned'] += result['num_not_captioned'];
  }

  return cat_counts;
}

function initializeCatCounts(){

  var cat_counts = [];

  for (var i=0; i<Object.keys(clean_cats).length; i++){
    var title = Object.keys(clean_cats)[i];
    cat_counts.push({});
    cat_counts[i]['title'] = title;
    cat_counts[i]['id'] = clean_cats[title];
    cat_counts[i]['num_captioned'] = 0;
    cat_counts[i]['num_not_captioned'] = 0;
  }

  return cat_counts;
}

function getDataForDateRange(startdate, enddate){

  console.log('Calling getDataForDateRange for startdate='+startdate+', enddate='+enddate);

  var promise = new Parse.Promise();

  var cat_counts = initializeCatCounts();

  var promises = [];

  for (var cur_date = startdate; cur_date <= enddate; cur_date.setDate(cur_date.getDate()+1)){

    var db_promise = Parse.Cloud.run('getData', {date: cur_date});

    promises.push(db_promise);

    db_promise.then(function(results){
      var num_results = results.length;
      console.log("Checked database for date " + cur_date + ".");

      if (num_results == 0){
        console.log("0 items match the query. Will check API for data and store data.");  
        
        var api_promise = callAPIforDate(cur_date);
        promises.push(api_promise);

        api_promise.then(function(count){

          console.log("Retrieved "+count.length+" items from API for date "+cur_date+".");

          Parse.Cloud.run('putCatCountsInDatabase',{cat_counts: count,date: cur_date}).then(function(results){
            console.log('Successfully put items in database.');
            }, function(error){
            console.log('Error saving.'+error.message);
          });

          if (cat_counts == []){
            cat_counts = count;
          } else {
            for (var i = 0; i < count.length; i++){
              cat_counts[i].num_captioned += count[i].num_captioned;
              cat_counts[i].num_not_captioned += count[i].num_not_captioned;
            }
          }
    
        }, function(error){
          promise.reject(error);
        });

      } else {
        // got results from database.
        console.log(num_results+" items match the query.");

        var count = convertDBresultsToCatCounts(results);
        if (cat_counts == []){
          cat_counts = count;
        } else {
          for (var i = 0; i < count.length; i++){

            cat_counts[i].num_captioned += count[i].num_captioned;
            cat_counts[i].num_not_captioned += count[i].num_not_captioned;
          }
        }

      }
    }, function(error){
      promise.reject(error);
    });   


  }

  Promise.all(promises).then(function(dataArr){
    promise.resolve(cat_counts);
  })

  return promise;

}


function callAPIforDate(date){

  var promise = new Parse.Promise();

  var cat_counts = [];
  
  // making this a dictionary so it's passed by reference
  num_completed = { 'completed' : 0, 'total' : 2*Object.keys(clean_cats).length };

  var promises = [];

  var i=0;
  for (var title in clean_cats){
    cat_counts.push({});
    var cat_id = clean_cats[title];
    cat_counts[i]['id'] = cat_id;
    cat_counts[i]['title'] = title;
    cat_counts[i]['num_captioned'] = 0;
    cat_counts[i]['num_not_captioned'] = 0;

    promises.push(singleAPICall(date, cat_id, true, cat_counts, i, num_completed));
    promises.push(singleAPICall(date, cat_id, false, cat_counts, i, num_completed));
    i+=1;
  }

  Promise.all(promises).then(function(dataArr){
    dataArr.forEach(function(data){
      cat_counts[data['i']][data['capt_key']] += data['count'];
    });

    promise.resolve(cat_counts);
  }).catch(function(err){
    console.log(err);
    promise.reject(err);
  })

  return promise;

}


/* cat_counts is passed by reference */
function singleAPICall(date, cat_id, captioned, cat_counts, i, num_completed){

  var next_date = new Date();
  next_date.setTime(date.getTime());
  next_date.setDate(next_date.getDate()+1);

  var fn_promise = new Parse.Promise();

  var capt_str, capt_key;
  if (captioned){
    capt_str = "closedcaption";
    capt_key = "num_captioned";
  } else {
    capt_str = "none";
    capt_key = "num_not_captioned";
  }

  var api_key = "AIzaSyA2qExhE65k0s4SCHl2wwcCWyPdgtoTyFg"

  var api_url = "https://www.googleapis.com/youtube/v3/search?publishedAfter="+
    date.toJSON() + "&publishedBefore="+next_date.toJSON() +
    "&order=date&part=id&videoCaption="+capt_str+
    "&type=video&videoCategoryId="+cat_id+
    "&maxResults=0&key="+api_key;

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

        if (count >= 1000000){

          console.log('Count for the datetime range '+date+' - '+next_date + 'for category ' +cat_id +' exceeded the Youtube API max return of 1 000 000. Retrying by dividing date range in half.');
          var diff = Math.abs(next_date - date);
          var half_date = new Date();
          half_date.setTime(date.getTime() + diff/2);
          num_completed['total'] += 1 // since we're adding 2 more calls

          var promise1 = singleAPICall(date, half_date, cat_id, captioned, cat_counts, i, num_completed);
          var promise2 = singleAPICall(half_date, next_date, cat_id, captioned, cat_counts, i, num_completed);

          $.when(promise1, promise2).done(function(data1, data2){
            fn_promise.resolve( {
              'i' : i,
              'count' : data1['count'] + data2['count'],
              'capt_key' : data1['capt_key'] 
            } );
          })

        } else {
          fn_promise.resolve( {
            'i' : i,
            'count' : count,
            'capt_key' : capt_key
          })
        
        }
      }
    }
  )

  promise.fail( function (response){
      throw 'Error accessing API: '+response;
    }
  );

  return fn_promise;

}
