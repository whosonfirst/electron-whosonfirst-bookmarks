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

	console.log("VISITS");
	
	var db = require("./mapzen.whosonfirst.bookmarks.database.js");
	var conn = db.conn();
	
	var canvas = require("./mapzen.whosonfirst.bookmarks.canvas.js");
	var desires = require("./mapzen.whosonfirst.bookmarks.desires.js");	

	var places = require("./mapzen.whosonfirst.bookmarks.places.js");
	
	var namify = require("./mapzen.whosonfirst.bookmarks.namify.js");
	var geojson = require("./mapzen.whosonfirst.bookmarks.geojson.js");
	
	var self = {
		
		'init': function(){
			
		},

		'show_visits': function(){

			db.get_visits(function(err, rows){

				if (err){
					console.log(err);
					return false;
				}
				
				self.draw_visits(rows);
			});
		},

		'render_visits': function(rows){

			var count = rows.length;
			
			var list = document.createElement("ul");
			list.setAttribute("class", "list visits-list");
			
			for (var i=0; i < count; i++){
				
				var row = rows[i];

				var lat = row['latitude'];
				var lon = row['longitude'];
				
				var locality_id = row['locality_id'];
				
				var status_id = row['status_id'];
				var desire = desires.id_to_label(status_id);
				
				var q = document.createElement("q");
				q.appendChild(document.createTextNode(desire));			

				var span = document.createElement("span");
				span.setAttribute("class", "place-name");
				span.setAttribute("data-wof-id", row['wof_id']);	
				span.appendChild(document.createTextNode(row['name']));

				span.onclick = function(e){
					var el = e.target;
					var wof_id = el.getAttribute("data-wof-id");

					places.show_place(wof_id);
				};			

				if (locality_id){
					span.appendChild(document.createTextNode(", in "));

					var loc = document.createElement("span");
					loc.setAttribute("class", "place-name-locality namify");
					loc.setAttribute("id", "place-locality-" + locality_id);
					loc.setAttribute("data-wof-id", locality_id);					
					loc.appendChild(document.createTextNode(locality_id));

					span.appendChild(loc);
				}
				
				var remove = document.createElement("button");
				remove.setAttribute("class", "btn btn-sm remove");
				remove.setAttribute("data-visit-id", row['id']);
				
				remove.appendChild(document.createTextNode("⃠"));
				
				remove.onclick = function(e){
					
					var el = e.target;
					var id = el.getAttribute("data-visit-id");
					
					if (! confirm("Are you sure you want to delete this visit?")){
						return false;
					}
					
					self.remove_visit(id, function(){
						self.show_visits();
					});
					
					return false;
				};

				span.appendChild(remove);
				
				var sm = document.createElement("small");
				sm.appendChild(document.createTextNode("You said "));
				sm.appendChild(q);
				sm.appendChild(document.createTextNode(" on or around "));

				var date = document.createElement("span");
				date.setAttribute("class", "datetime");
				date.appendChild(document.createTextNode(row['date']));

				sm.appendChild(date);
								
				var item = document.createElement("li");
				item.setAttribute("class", "visits-list-item");
				item.setAttribute("data-latitude", lat);
				item.setAttribute("data-longitude", lon);				
				item.appendChild(span);
				item.appendChild(sm);
				
				list.appendChild(item);
			}

			var visits = document.createElement("div");
			visits.setAttribute("id", "visits");
			visits.appendChild(list);

			return visits;
		},
		
		'draw_visits': function(rows){

			var visits = self.render_visits(rows);

			var swlat;
			var swlon;
			var nelat;
			var nelon;

			var features = [];
			
			var items = visits.getElementsByClassName("visits-list-item");
			var count = items.length;			

			for (var i=0; i < count; i++){

				var el = items[i];
				
				var lat = el.getAttribute("data-latitude");
				var lon = el.getAttribute("data-longitude");				

				lat = parseFloat(lat);
				lon = parseFloat(lon);				
				
				if ((! swlat) || (lat < swlat)){
					swlat = lat;
				}
				
				if ((! swlon) || (lon < swlon)){
					swlon = lon;
				}
				
				if ((! nelat) || (lat > nelat)){
					nelat = lat;
				}
				
				if ((! nelon) || (lon > nelon)){
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
					"properties": props
				};

				features.push(feature);
			}

			var feature_collection = {
				"type": "FeatureCollection",
				"features": features,
			};
			
			var left_panel = document.createElement("div");
			left_panel.setAttribute("class", "col-md-6 panel");
			
			var right_panel = document.createElement("div");
			right_panel.setAttribute("class", "col-md-6 panel");
							
			var map_el = document.createElement("div");
			map_el.setAttribute("id", "map");
				
			left_panel.appendChild(map_el);			
			right_panel.appendChild(visits);

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

			geojson.add_featurecollection_to_map(map, feature_collection);

			namify.translate();
		},

		'add_visit': function(pl, status_id, cb){

			var on_save = function(err){

				places.save_place(pl);
				places.save_hierarchy(pl);

				cb(err);
			};

			self.save_visit(pl, status_id, on_save);
		},
		
		'save_visit': function(pl, status_id, cb){

			var wof_id = pl['wof:id'];
			var name = pl['wof:name'];			
			var lat = pl['geom:latitude'];
			var lon = pl['geom:longitude'];			

			var hier = pl['wof:hierarchy'];
			hier = hier[0];				// PLEASE FIX ME

			var neighbourhood_id = 0
			var locality_id = 0
			var region_id = 0
			var country_id = 0

			if (hier){
				neighbourhood_id = hier['neighbourhood_id'];
				locality_id = hier['locality_id'];
				region_id = hier['region_id'];
				country_id = hier['country_id'];			
			}
			
			var dt = new Date;
			dt = dt.toISOString();

			var sql = "INSERT INTO visits (wof_id, name, latitude, longitude, neighbourhood_id, locality_id, region_id, country_id, status_id, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
			
			var params = [wof_id, name, lat, lon, neighbourhood_id, locality_id, region_id, country_id, status_id, dt];

			conn.run(sql, params, cb);
		},

		'remove_visit': function(visit_id, cb){

			var sql = "DELETE FROM visits WHERE id = ?";
			var params = [ visit_id ];

			conn.run(sql, params, cb);
		},
		
		'get_visits_for_locality': function(wof_id, cb){

			var sql = "SELECT * FROM visits WHERE locality_id = ?";
			var params = [ wof_id ];

			conn.all(sql, params, cb);
		},

		'get_visits_for_neighbourhood': function(wof_id, cb){

			var sql = "SELECT * FROM visits WHERE neighbourhood_id = ?";
			var params = [ wof_id ];

			conn.all(sql, params, cb);
		}
		
	}

	return self;
}));
