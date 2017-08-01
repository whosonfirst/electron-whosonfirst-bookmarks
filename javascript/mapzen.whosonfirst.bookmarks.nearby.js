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

	const db = require("./mapzen.whosonfirst.bookmarks.database.js");
	const conn = db.conn();

	const namify = require("./mapzen.whosonfirst.bookmarks.namify.js");
	
	const canvas = require("./mapzen.whosonfirst.bookmarks.canvas.js");
	const desires = require("./mapzen.whosonfirst.bookmarks.desires.js");

	const api = require("./mapzen.whosonfirst.api.js");
	const geojson = require("./mapzen.whosonfirst.bookmarks.geojson.js");
	const maps = require("./mapzen.whosonfirst.bookmarks.maps.js");

	const screenshots = require("./mapzen.whosonfirst.bookmarks.screenshots.js");
	
	const utils = require("./mapzen.whosonfirst.utils.js");	
	const fb = require("./mapzen.whosonfirst.bookmarks.feedback.js");
	
	var self = {
		
		'init': function(){

		},

		'show_nearby': function(){

			var map_el = document.createElement("div");
			map_el.setAttribute("id", "map");

			var left_panel = document.createElement("div");
			left_panel.setAttribute("class", "col-md-6 panel");

			var right_panel = document.createElement("div");
			right_panel.setAttribute("class", "col-md-6 panel");

			left_panel.appendChild(map_el);

			
			canvas.reset();
			canvas.append(left_panel);
			canvas.append(right_panel);			

			var map = maps.new_map(map_el);

			var lat = 29.817632;
			var lon = -95.462296
			var zoom = 16;
			
			map.setView([lat, lon], zoom);
			
			var fetch_nearby = function(e){

				var m = e.target;				
				var ll = m.getCenter();

				var method = "whosonfirst.places.getNearby";

				var args = {
					"latitude": ll.lat,
					"longitude": ll.lng,
					"extras": "addr:,edtf:,geom:,lbl:,mz:,wof:hierarchy,wof:superseded_by,wof:tags"
				};
				
				var api_key = document.body.getAttribute("data-api-key");
				var api_endpoint = document.body.getAttribute("data-api-endpoint");
				
				api.set_handler('authentication', function(){
					return api_key;
				});
				
				api.set_handler('endpoint', function(){
					return api_endpoint;
				});

				var on_success = function(rsp){

					console.log(rsp);					
					var places = rsp["places"];
					geojson.add_spr_to_map(map, places);				
				};

				var on_error = function(rsp){
					fb.error(rsp);
				};

				api.execute_method(method, args, on_success, on_error);				
			};
			
			map.on("moveend", fetch_nearby);
		}
	}

	return self;
}));
