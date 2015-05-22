var clean_cats = {"Film & Animation":"1","Autos & Vehicles":"2","Music":"10","Pets & Animals":"15","Sports":"17","Short Movies":"18","Travel & Events":"19","Gaming":"20","Videoblogging":"21","People & Blogs":"22","Comedy":"34","Entertainment":"24","News & Politics":"25","Howto & Style":"26","Education":"27","Science & Technology":"28","Nonprofits & Activism":"29","Movies":"30","Anime/Animation":"31","Action/Adventure":"32","Classics":"33","Documentary":"35","Drama":"36","Family":"37","Foreign":"38","Horror":"39","Sci-Fi/Fantasy":"40","Thriller":"41","Shorts":"42","Shows":"43","Trailers":"44"}

Parse.Cloud.define("getData", function(request, response){
  var date = request.params.date;
  var next_date = request.params.next_date;

  var DayCounts = Parse.Object.extend("DayCounts");
  var query = new Parse.Query(DayCounts);
  query.descending("num_not_captioned");
  query.equalTo("date",date);

  //query.lessThan("date",next_date);
  query.find().then(function(results){
    var num_results = results.length;
    console.log("Successfully checked database for date range "+date+" - "+next_date+".")
    if (num_results == 0){
      console.log("0 items match the query. Will query API instead and store data.");  
      
      var APIcallPromise = callAPIforDate(date,next_date);

      // get the data, store in database, return
      APIcallPromise.done(function(cat_counts){
        console.log('cat counts:');
        console.log(cat_counts);
        
        putCatCountsInDatabase(cat_counts,date);
        response.success(cat_counts);
      }); 

      APIcallPromise.fail(function(error){
        response.error(error);
      });

    } else {
      // got results from database.
      console.log(num_results+" items match the query.");

      var cat_counts = convertDBresultsToCatCounts(results);
      response.success(cat_counts);
    }
  })

})

function putCatCountsInDatabase(cat_counts,date){
  console.log('Storing '+cat_counts.length+' rows in database.')
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
    catDayCounts.save();
  }
}

/* cat_counts is passed by reference */
function singleAPICall(date, next_date, cat_id, captioned, cat_counts, i, num_completed){

  var promise = new Parse.Promise();

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

  Parse.Cloud.httpRequest({
    url: api_url,
    index: i,
    date: date,
    type: 'GET'
  }).then(function(response){
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

        Parse.Promise.when(promise1, promise2).done(function(data1, data2){
        promise.resolve({
            'i' : i,
            'count' : data1['count'] + data2['count'],
            'capt_key' : data1['capt_key'] 
          });
        });
      } else {
        promise.resolve({
          'i' : i,
          'count' : count,
          'capt_key' : capt_key
        });
      }
    }
  }, function(error){
    console.log(error);
    promise.reject(error);
  })

  return promise;

}

function callAPIforDate(date, next_date){

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

    promises.push(singleAPICall(date, next_date, cat_id, true, cat_counts, i, num_completed));
    promises.push(singleAPICall(date, next_date, cat_id, false, cat_counts, i, num_completed));
    i+=1;
  }

  Parse.Promise.when(promises).then(function(){
    for (var i=0; i<arguments.length; i++){
      var data = arguments[i];
      cat_counts[data['i']][data['capt_key']] += count;
    }

    promise.resolve(cat_counts);
  }, function(error){
    promise.reject(error);
  })

  return promise;
}



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