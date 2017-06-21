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

			var ids = [];
			
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

					ids.push(wof_id);
					
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
					var el = e.target;
					var wof_id = el.getAttribute("data-wof-id");

					var places = require("./mapzen.whosonfirst.bookmarks.places.js");						
					places.show_place(wof_id);
					return;
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


			var count_ids = ids.length;

			if (count_ids){

				var str_ids = ids.join(",");
				
				var sql = "SELECT * FROM places WHERE wof_id IN (" + str_ids + ")";
				var params = [];

				var cb = function(err, rows){

					if (err){
						fb.error(err);
						return false;
					}

					var swlat;
					var swlon;
					var nelat;
					var nelon;

					var features = [];

					var count_rows = rows.length;

					for (var i=0; i < count_rows; i++){

						var row = rows[i];
						var body = row['body'];
						var props = JSON.parse(body);

						var lat = props['geom:latitude'];
						var lon = props['geom:longitude'];

						if ((props['lbl:latitude']) && (props['lbl:longitude'])){
							
							lat = props['lbl:latitude'];
							lon = props['lbl:longitude'];
						}

						if ((! swlat) || (lat < swlat)){
							swlat = lat;
						}

						if ((! swlon) || (lat < swlon)){
							swlon = lon;
						}

						if ((! nelat) || (lat > nelat)){
							nelat = lat;
						}

						if ((! nelon) || (lat > nelon)){
							nelon = lon;
						}

						var coords = [ lon, lat ];
						
						var geom = {
							"type": "Point",
							"coordinates": coords
						};
						
						var props = {};

						var feature = {
							"type": "Feature",
							"geometry": geom,
							"properties": props,
						};

						features.push(feature);
					}

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
				};

				console.log(sql, params);

				conn.all(sql, params, cb);
			}
			
			namify.translate();			
		}
		
	}

	return self;
}));
