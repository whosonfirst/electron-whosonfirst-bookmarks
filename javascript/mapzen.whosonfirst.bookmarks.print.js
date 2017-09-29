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

			if (more["visits"]) {

				// please make less confusing variable names...
				// (20170929/thisisaaronland)
				
				var visits = more["visits"];
				
				for (var label in visits){

					doc.text(label, { stroke: true })
					doc.moveDown();

					var places = visits[label];
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
			
			doc.end()
		}
	}

	return self;
}));
	
