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

	const places = require("./mapzen.whosonfirst.bookmarks.places.js");	
	const canvas = require("./mapzen.whosonfirst.bookmarks.canvas.js");

	const namify = require("./mapzen.whosonfirst.bookmarks.namify.js");	

	const fb = require("./mapzen.whosonfirst.bookmarks.feedback.js");	
	
	var self = {
		
		'init': function(){
		},

		'show_placetype': function(pt){

			var pt_col = pt + "_id";
			
			var sql = "SELECT " + pt_col + " AS wof_id, COUNT(id) AS count_visits FROM visits GROUP BY " + pt_col + " ORDER BY count_visits DESC";
			var params = [];

			var cb = function(err, rows){

				if (err){
					fb.error(err);
					return false;
				}
				
				self.draw_placetype(pt, rows);
			};

			conn.all(sql, params, cb);
		},

		'draw_placetype': function(pt, rows){

			var count = rows.length;

			var places = document.createElement("ul");
			places.setAttribute("class", "list placetype-list");
			
			for (var i=0; i < count; i++){
				
				var row = rows[i];
				var wof_id = row['wof_id'];
				var count_visits = row['count_visits'];				

				var item = document.createElement("li");
				item.setAttribute("class", "list placetype-list-item");
				
				var place = document.createElement("span");

				if (wof_id){
					place.setAttribute("class", "place-name namify");
					place.setAttribute("data-wof-id", wof_id);				
					place.appendChild(document.createTextNode(wof_id));
				}

				else {
					place.setAttribute("class", "place-name place-name-none");
					place.setAttribute("data-wof-id", wof_id);
					place.appendChild(document.createTextNode("a place with no name"));
				}
				
				place.onclick = function(e){

				};
				
				item.appendChild(place);

				var sm = document.createElement("small");
				sm.appendChild(document.createTextNode("you've mentioned this place"));
				
				var visits = document.createElement("span");
				visits.setAttribute("class", "placetype-count");
				
				if (count_visits == 1){
					visits.appendChild(document.createTextNode(" once"));
				}

				else {
					visits.appendChild(document.createTextNode(" " + count_visits + " times"));
				}

				visits.onclick = function(e){

				};

				sm.appendChild(visits);
				item.appendChild(sm);
				
				places.appendChild(item);
			}

			var left_panel = document.createElement("div");
			left_panel.setAttribute("class", "col-md-6 panel");
			
			var right_panel = document.createElement("div");
			right_panel.setAttribute("class", "col-md-6 panel");
							
			var map_el = document.createElement("div");
			map_el.setAttribute("id", "map");
				
			left_panel.appendChild(map_el);			
			right_panel.appendChild(places);

			canvas.reset();
			canvas.append(left_panel);
			canvas.append(right_panel);
			
			var api_key = document.body.getAttribute("data-api-key");			
			L.Mapzen.apiKey = api_key;
			
			var map = L.Mapzen.map('map', {
    				tangramOptions: {
    					scene: L.Mapzen.BasemapStyles.Refill
    				}
			});

			/*
			var sw = L.latLng(swlat, swlon);
			var ne = L.latLng(nelat, nelon);

			var bounds = L.latLngBounds(sw, ne);
			var opts = { "padding": [50, 50] };
			
			map.fitBounds(bounds, opts);

			var feature_collection = {
				"type": "FeatureCollection",
				"features": features,
			};

			L.geoJSON(feature_collection).addTo(map);
			*/
			
			namify.translate();
		}
		
	}

	return self;
}));
