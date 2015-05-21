Parse.Cloud.define("queryYoutubeAPI", function(request, response){
	var date = request.params.date;
	var next_date = new Date();
	next_date.setDate(date.getDate()+1);

	var api_url = "https://www.googleapis.com/youtube/v3/search?publishedAfter=2015-04-11T00%3A00%3A00Z&publishedBefore=2015-04-12T00%3A00%3A00Z&order=date&part=id&videoCaption=none&type=video&videoCategoryId=17&maxResults=5&key=AIzaSyA2qExhE65k0s4SCHl2wwcCWyPdgtoTyFg";

	Parse.Cloud.httpRequest({ 
		url: api_url,
		success: function(httpResponse){
			response.success("RETURNING FROM PARSE "+httpResponse.pageInfo.totalResults);
		},
		error: function(httpResponse){
			response.error("Request failed with response code "+httpResponse.status);
		}
		 
  	});

	// response.error('got_an_error');


});


Parse.Cloud.define("testtext", function(request, response) {
  text = new Date();

  // var query = new Parse.Query("Review");
  // query.equalTo("movie", request.params.movie);
  // query.find({
  //   success: function(results) {
  //     var sum = 0;
  //     for (var i = 0; i < results.length; ++i) {
  //       sum += results[i].get("stars");
  //     }
  //     response.success(sum / results.length);
  //   },
  //   error: function() {
  //     response.error("movie lookup failed");
  //   }
  // });
  response.success(text);
});