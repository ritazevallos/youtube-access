/* Make buttons for each category */
function addButtons(cat_counts){

	for(i=0; i<cat_counts.length; i++){

		var cat = cat_counts[i];

    	//Create an input type dynamically.   
    	var element = document.createElement("input");
    	//Assign different attributes to the element. 
    	element.type = cat;
    	element.value = cat; // Really? You want the default value to be the type string?
    	element.name = cat.name;  // And the name too?
    	element.onclick = function() { // Note this is a function
        	alert("blabla");
    	};

    	//var foo = document.getElementById("fooBar");
    	//Append the element in page (in span).  
    	//foo.appendChild(element);
	}
}