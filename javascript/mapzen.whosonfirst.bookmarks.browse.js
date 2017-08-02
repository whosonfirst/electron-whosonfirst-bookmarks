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

	const geo = require("./mapzen.whosonfirst.bookmarks.geolocation.js");	
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

		'show_browse': function(){

			var map_el = document.createElement("div");
			map_el.setAttribute("id", "map");

			var map_feedback = document.createElement("div");
			map_feedback.setAttribute("id", "map-feedback");

			var left_panel = document.createElement("div");
			left_panel.setAttribute("class", "col-md-6 panel");

			var right_panel = document.createElement("div");
			right_panel.setAttribute("class", "col-md-6 panel");

			left_panel.appendChild(map_el);
			left_panel.appendChild(map_feedback);			

			var places_wrapper = document.createElement("div");
			places_wrapper.setAttribute("id", "places-list-wrapper");

			right_panel.appendChild(places_wrapper);
			
			canvas.reset();
			canvas.append(left_panel);
			canvas.append(right_panel);			

			var map = maps.new_map(map_el);
			var nearby_layer;
			
			var fetch_nearby = function(e){

				var m = e.target;

				if (m.getZoom() < 14){
					return;
				}

				var ll = m.getCenter();

				var method = "whosonfirst.places.getNearby";

				var args = {
					"latitude": ll.lat,
					"longitude": ll.lng,
					"radius": 100,
					"placetype": "venue",
					"extras": "addr:,edtf:,geom:,lbl:,mz:,wof:hierarchy,wof:superseded_by,wof:tags",
					"per_page": 500,
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

					if (nearby_layer){
						nearby_layer.remove();

						places_wrapper.innerHTML = "";
					}
					
					var places = rsp["places"];
					var layer = geojson.add_spr_to_map(map, places);

					nearby_layer = layer;

					var places_list = self.render_places_list(places);
					places_wrapper.appendChild(places_list);
				};

				var on_error = function(rsp){
					fb.error(rsp);
				};

				api.execute_method(method, args, on_success, on_error);				
			};

			// add a geocoder
			
			var layers = [
				"locality",
				"country"
			];

			var params = {
				"sources": "wof"
			};
			
			var opts = {
				// "layers": layers,
				// "params": params,
				"focus": false,
				"panToPoint": false,
			};

			var geocoder = L.Mapzen.geocoder(opts);
			geocoder.addTo(map);

			// https://github.com/mapzen/leaflet-geocoder#events
			
			geocoder.on('select', function(e) {

				var feature = e.feature;
				
				if (! feature){
					return;
				}

				var geom = feature["geometry"];

				if (geom["type"] != "Point"){
					return;
				}

				var coords = geom["coordinates"];
				var lat = coords[1];
				var lon = coords[0];
				var zoom = 15;
				
				map.setView([lat, lon], zoom);				
			});
			
			map.on("moveend", fetch_nearby);

			var on_geolocate = function(data){

				var loc = data["location"];
				var acc = data["accuracy"];
				
				var lat = loc["lat"];
				var lon = loc["lng"];

				console.log("[geolocated]", lat, lon, acc);
				
				map.setView([lat, lon], 12);	// mmmmmaybe?
			};

			var on_geolocate_error = function(){

			};		
			
			// sudo put me in a function... ?

			var sql = "SELECT DISTINCT(locality_id) AS locality_id FROM visits WHERE locality_id != 0 ORDER BY date DESC LIMIT 1";
			var params = [];
			
			conn.get(sql, params, function(err, row){

				if (err){
					return geo.geolocate(on_geolocate, on_geolocate_error);
				}

				var locality_id = row["locality_id"];

				if (! locality_id){
					return geo.geolocate(on_geolocate, on_geolocate_error);					
				}
				
				var places = require("./mapzen.whosonfirst.bookmarks.places.js");
				
				places.get_place(locality_id, function(err, row){

					if (err){
						return geo.geolocate(on_geolocate, on_geolocate_error);
					}

					try {
						var pl = JSON.parse(row["body"]);
						var bbox = pl["geom:bbox"];
						bbox = bbox.split(",");
						
						var min_lat = bbox[1];
						var min_lon = bbox[0];
						var max_lat = bbox[3];
						var max_lon = bbox[2];
					}

					catch (e){
						return geo.geolocate(on_geolocate, on_geolocate_error);
					}
					
					var sw = L.latLng(min_lat, min_lon);
					var ne = L.latLng(max_lat, max_lon);
					
					var bounds = L.latLngBounds(sw, ne);
					var opts = {  };
					
					map.fitBounds(bounds, opts);
				});
			});
		},

		'render_places_list': function(rows){

			var count = rows.length;

			var list = document.createElement("ul");
			list.setAttribute("class", "list");

			for (var i=0; i < count; i++){

				var row = rows[i];
				
				var item = document.createElement("li");

				var span = document.createElement("span");
				span.setAttribute("class", "hey-look");

				span.appendChild(document.createTextNode(row["wof:name"]));

				item.appendChild(span);
				list.appendChild(item);
			}

			return list;
		}
	}

	return self;
}));
