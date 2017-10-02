(function(f){

        if (typeof exports === "object" && typeof module !== "undefined"){
		module.exports = f();
        }

        else if (typeof define === "function" && define.amd){
		define([],f);
        }

        else {
		var g;

		if (typeof window!=="undefined") {
			g=window;
		} else if (typeof global!=="undefined") {
			g=global;
		} else if (typeof self!=="undefined") {
			g=self;
		} else {
			g=this;
		}
		
        }

}(function(){

	const {dialog} = require('electron').remote;
	
	const PDFDocument = require('pdfkit');
	const fs = require('fs');
	
	const screenshots = require('./mapzen.whosonfirst.bookmarks.screenshots.js');
	
	var self = {
		
		'init': function(){

		},

		'print_trip': function(trip, more){

			if (! more){
				more = {};
			}

			var path = dialog.showSaveDialog();			

			if (! path){
				return;
			}

			var wof_id = trip["wof_id"];
			
			// please format me...
			
			var arrival = trip["arrival"];
			var departure = trip["departure"];			
			var status = trip["status_id"];
			
			var fh = fs.createWriteStream(path);
			
			var doc = new PDFDocument();
			doc.pipe(fh);

			if (screenshots.exists(wof_id)){

				var data = screenshots.data_url(wof_id);
				doc.image(data, { fit: [1224, 432] });	// 8.5 x 3 @ 144 DPI
				doc.moveDown();
			}
			
			doc.fontSize(12);
			doc.font('Times-Roman');

			doc.text(trip["name"], { stroke:true });
			doc.moveDown();
			
			doc.text(arrival + " to " + departure + " (" + status + ")");
			doc.moveDown();
			
			if (trip["notes"]){
				doc.text(trip["notes"]);
				doc.moveDown();				
			}

			// console.log("MORE", more);
			
			if (more["visits"]) {

				// please make less confusing variable names...
				// (20170929/thisisaaronland)
				
				var visits = more["visits"];
				var buckets = {};

				for (var label in visits){

					// group #feelings by neighbourhood but really maybe we
					// should be grouping neighbourhoods by #feelings...
					// (20171002/thisisaaronland)
					
					if (! buckets[label]){
						buckets[label] = {};
					}

					var places = visits[label];
					var count_places = places.length;

					for (var i=0; i < count_places; i++){

						var container = "a place with no name";
						var visit = places[i];

						if (more["parents"]){
						    
							var place = visit["place"];
							
							if (place){
								
								var body = place["body"];
								var data = JSON.parse(body);
								var parent_id = data["wof:parent_id"];

								if (more["parents"][parent_id]){
									var parent_data = more["parents"][parent_id];
									
									if (parent_data["body"]){
										parent_data = JSON.parse(parent_data["body"]);
									}
									
									var parent_name = parent_data["wof:name"];
									
									if (parent_name){
										container = parent_name;
									} else {
										console.log("FAILED TO DETERMINE PARENT NAME", parent_id, parent_data);
									}
								}
							}
						}

						if (! buckets[label][container]){
							buckets[label][container] = [];
						}

						buckets[label][container].push(visit);
					}
					
				}

				// console.log("BUCKETS", buckets);
				
				for (var feelings in buckets){

					// doc.text(feelings, { stroke: true })
					// doc.moveDown();

					for (container in buckets[feelings]){

						var label = feelings + ", in " + container;
						
						doc.text(label, { stroke: true })
						doc.moveDown();

						var places = buckets[feelings][container];
						var count_places = places.length;

						for (var i=0; i < count_places; i++){

							var visit = places[i];
							var place = visit["place"];
							
							var text = [
								visit["name"]
							];					
							
							var tags = [];
							
							if (place){
								
								var body = place["body"];
								var data = JSON.parse(body);
								
								if (data["addr:full"]){
									text.push(data["addr:full"])
								}
								
								if (data["addr:phone"]){
									text.push(data["addr:phone"])
								}
								
								if ((data["wof:tags"]) && (data["wof:tags"].length)){
									tags = data["wof:tags"];
								}
							}
							
							doc.text(text.join(" / "));
							
							if (tags.length){
								tags = tags.join(", ");
								doc.text(tags);
							}
							
							doc.moveDown();
						}
						
						doc.moveDown();
					}
				}
			}
			
			doc.end()
		}
	}

	return self;
}));
	
