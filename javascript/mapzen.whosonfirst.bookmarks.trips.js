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
	const maps = require("./mapzen.whosonfirst.bookmarks.maps.js");
	const geojson = require("./mapzen.whosonfirst.bookmarks.geojson.js");
	
	const fb = require("./mapzen.whosonfirst.bookmarks.feedback.js");		

	const status = {
		0: "unknown",
		1: "tentative",
		2: "confirmed",
		3: "i want this to happen"
	};
	
	var self = {

		'show_trips': function(){

			self.get_trips(function(err, rows){

				if (err){
					fb.error(err);
					return false;
				}

				self.draw_trips(rows);
			});
		},

		'get_trips': function(cb){

			var sql = "SELECT * FROM trips ORDER BY arrival DESC, departure ASC";
			var params = [];

			conn.all(sql, params, cb);			
		},

		'show_trips_for_place': function(wof_id){

			self.get_trips_for_place(wof_id, function(err, rows){

				if (err){
					fb.error(err);
					return false;
				}

				self.draw_trips(rows);
			});
		},

		'get_trips_for_place': function(wof_id, cb){

			var sql = "SELECT * FROM trips WHERE wof_id = ? ORDER BY arrival DESC, departure ASC";
			var params = [ wof_id ];

			conn.all(sql, params, cb);			
		},

		'show_trips_for_status': function(status_id){

			self.get_trips_for_status(status_id, function(err, rows){

				if (err){
					fb.error(err);
					return false;
				}

				self.draw_trips(rows);
			});
		},

		'get_trips_for_status': function(status_id, cb){

			var sql = "SELECT * FROM trips WHERE status_id = ? ORDER BY arrival DESC, departure ASC";
			var params = [ status_id ];

			conn.all(sql, params, cb);			
		},
		
		'draw_trips': function(rows){

			var left_panel = document.createElement("div");
			left_panel.setAttribute("class", "col-md-6 panel panel-left");

			var right_panel = document.createElement("div");
			right_panel.setAttribute("class", "col-md-6 panel panel-right");

			var map_el = document.createElement("div");
			map_el.setAttribute("id", "map");

			var button = document.createElement("button");
			button.setAttribute("class", "btn btn-sm");
			button.appendChild(document.createTextNode("Add trip"));
			
			button.setAttribute("style", "float:right");	// sudo make me a CSS class...
			
			button.onclick = function(e){
				self.show_trip();
				return false;
			};
			
			var trips_list = self.render_trips_list(rows);
			
			left_panel.appendChild(map_el);
			right_panel.appendChild(button);			
			right_panel.appendChild(trips_list);

			canvas.reset();			
			canvas.append(left_panel);
			canvas.append(right_panel);

			var map = maps.new_map(map_el);
			self.draw_map_for_trips(map, rows);
		},

		'draw_map_for_trips': function(map, rows){

			var count = rows.length;
			
			var tmp = {};

			for (var i=0; i < count; i++){
				var trip = rows[i];
				var wof_id = trip["wof_id"];
				tmp[ wof_id ] ++;
			}

			var places = [];

			for (var wof_id in tmp){
				places.push(wof_id);
			}

			var sql = "SELECT * FROM places WHERE wof_id in (" + places.join(",") + ")";
			var params = [];

			console.log(sql);
			
			conn.all(sql, params, function(err, rows){

				if (err){
					console.log(err);
					return;
				}

				var features = [];
				
				var count = rows.length;

				for (var i = 0; i < count; i++){

					var row = rows[i];
					var body = row["body"];

					var data = JSON.parse(body);

					var lat = data["geom:latitude"];
					var lon = data["geom:longitude"];

					var coords = [ lon, lat ];
					var geom = { "type": "Point", "coordinates": coords };

					var feature = { "type": "Feature", "geometry": geom };
					features.push(feature);
				}

				var featurecollection = { "type": "FeatureCollection", "features": features };
				geojson.add_featurecollection_to_map(map, featurecollection);
			});
			
			console.log(places);
		},
		
		'render_trips_list': function(rows){

			var count = rows.length;
			
			var list = document.createElement("ul");
			list.setAttribute("class", "list trips-list");
			
			for (var i=0; i < count; i++){

				var trip = rows[i];

				var status_label = status[ trip["status_id" ]];

				var dest = document.createElement("span");
				dest.setAttribute("data-wof-id", trip["wof_id"]);
				dest.setAttribute("data-trip-id", trip["id"]);				
				dest.setAttribute("class", "trips-list-item-destination hey-look click-me");
				dest.appendChild(document.createTextNode(trip["name"]));

				dest.onclick = function(e){
					
					var el = e.target;
					var trip_id = el.getAttribute("data-trip-id");

					self.show_trip(trip_id);
					return false;
				};

				var dest_all = document.createElement("span");
				dest_all.setAttribute("class", "trips-list-item-destination-all");
				dest_all.setAttribute("title", "only show trips to this destination");
				dest_all.setAttribute("data-wof-id", trip["wof_id"]);				
				dest_all.appendChild(document.createTextNode("🌐"));

				dest_all.onclick = function(e){
					
					var el = e.target;
					var wof_id = el.getAttribute("data-wof-id");

					try {
						self.show_trips_for_place(wof_id);
					}

					catch (e){
						console.log(e);
					}
					
					return false;
				};

				var dest_wrapper = document.createElement("div");
				dest_wrapper.appendChild(dest);
				dest_wrapper.appendChild(dest_all);				
								
				var dates = document.createElement("div");
				dates.setAttribute("class", "trips-list-item-dates");
				dates.appendChild(document.createTextNode(trip["arrival"] + " to " + trip["departure"]));

				var remove = document.createElement("button");
				remove.setAttribute("class", "btn btn-sm remove");
				remove.setAttribute("data-trip-id", trip["id"]);
				
				remove.appendChild(document.createTextNode("⃠"));
				
				remove.onclick = function(e){
					
					var el = e.target;
					var id = el.getAttribute("data-trip-id");
				
					if (! confirm("Are you sure you want to delete this trip?")){
						return false;
					}
					
					self.remove_trip(id, function(){
						self.show_trips();
					});
					
					return false;
				};
				
				dates.appendChild(remove);
				var meta = document.createElement("li");
				meta.setAttribute("class", "list trips-list-item-meta");

				if (trip["notes"]){

					var notes = document.createElement("li");
					notes.setAttribute("class", "trips-list-item-notes");					
					notes.appendChild(document.createTextNode(trip["notes"]));
					meta.appendChild(notes);
				}

				var status_el = document.createElement("li");
				status_el.setAttribute("data-status-id", trip["status_id"]);
				status_el.setAttribute("class", "trips-list-item-status trips-list-item-status-" + status_label + " click-me");
				status_el.appendChild(document.createTextNode(status_label));

				status_el.onclick = function(e){

					var el = e.target;
					var status_id = el.getAttribute("data-status-id");

					self.show_trips_for_status(status_id);
					return false;
				};

				meta.appendChild(status_el);
				
				//
				
				var item = document.createElement("li");
				item.setAttribute("class", "trips-list-item");

				item.appendChild(dest_wrapper);				
				item.appendChild(dates);
				item.appendChild(meta);				
				
				list.appendChild(item);
			}

			return list;
		},

		'get_trip': function(trip_id, cb){

			var sql = "SELECT * FROM trips WHERE id = ?";
			var params = [ trip_id ];

			conn.get(sql, params, cb);
		},
		
		'show_trip': function(trip_id){

			self.get_trip(trip_id, function(err, row){

				if (err){
					fb.error(err);
					return false;
				}
				
				self.draw_trip(row);
			});
		},
		
		'draw_trip': function(trip){			

			var left_panel = document.createElement("div");
			left_panel.setAttribute("class", "col-md-6 panel panel-left");

			var right_panel = document.createElement("div");
			right_panel.setAttribute("class", "col-md-6 panel panel-right");

			var map_el = document.createElement("div");
			map_el.setAttribute("id", "map");

			var edit_form = self.render_edit_trip(trip);
			
			left_panel.appendChild(map_el);
			right_panel.appendChild(edit_form);

			canvas.reset();			
			canvas.append(left_panel);
			canvas.append(right_panel);			

			var map = maps.new_map(map_el);

			// please do something smarter...
			
			var sw = L.latLng(-50, -150);
			var ne = L.latLng(50, 150);
			
			var bounds = L.latLngBounds(sw, ne);
			var opts = { "padding": [100, 100] };
			
			map.fitBounds(bounds, opts);

			// maybe?
			
			if (trip){
				return;
			}
			
			// please get API key...

			// https://mapzen.com/documentation/mapzen-js/search/#control-the-search-query-behavior
			// https://mapzen.com/documentation/search/search/#available-search-parameters
			
			var layers = [
				"locality",
				"country"
			];

			var params = {
				"sources": "wof"
			};
			
			var opts = {
				"layers": layers,
				"params": params,
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
				
				var bbox = feature['bbox'];
				var props = feature['properties'];

				// console.log(props);
				
				var name = props["name"];
				var wof_id = props["source_id"];

				var dest = document.getElementById("destination");
				dest.setAttribute("data-wof-id", wof_id);
				dest.value = name;
			});
		},

		'render_edit_trip': function(trip){

			// destination

			var dest_group = document.createElement("div");
			dest_group.setAttribute("class", "form-group");
			dest_group.setAttribute("id", "trip-form");			

			var dest_label = document.createElement("label");
			dest_label.setAttribute("for", "destination");
			dest_label.appendChild(document.createTextNode("destination"));
			
			var dest_input = document.createElement("input");
			dest_input.setAttribute("id", "destination");
			dest_input.setAttribute("name", "destination");			
			dest_input.setAttribute("type", "text");
			dest_input.setAttribute("class", "trips-destination form-control");
			dest_input.setAttribute("data-wof-id", "");			
			dest_input.setAttribute("disabled", "disabled");
			
			dest_group.appendChild(dest_label);
			dest_group.appendChild(dest_input);			

			// arrival, departure
			
			var arrival_group = document.createElement("div");
			arrival_group.setAttribute("class", "form-group");

			var arrival_label = document.createElement("label");
			arrival_label.setAttribute("for", "calendar-arrival");
			arrival_label.appendChild(document.createTextNode("arrival"));
			
			var arrival_input = document.createElement("input");
			arrival_input.setAttribute("id", "calendar-arrival");
			arrival_input.setAttribute("name", "calendar-arrival");			
			arrival_input.setAttribute("type", "text");
			arrival_input.setAttribute("size", "10");			
			arrival_input.setAttribute("placeholder", "YYYY-MM-DD");
			arrival_input.setAttribute("class", "trips-calendar form-control");

			arrival_group.appendChild(arrival_label);
			arrival_group.appendChild(arrival_input);			

			var departure_group = document.createElement("div");
			departure_group.setAttribute("class", "form-group");
			
			var departure_label = document.createElement("label");
			departure_label.setAttribute("for", "calendar-departure");
			departure_label.appendChild(document.createTextNode("departure"));
			
			var departure_input = document.createElement("input");
			departure_input.setAttribute("id", "calendar-departure");
			departure_input.setAttribute("name", "calendar-departure");
			departure_input.setAttribute("size", "10");						
			departure_input.setAttribute("type", "text");
			departure_input.setAttribute("placeholder", "YYYY-MM-DD");			
			departure_input.setAttribute("class", "trips-calendar form-control");

			departure_group.appendChild(departure_label);
			departure_group.appendChild(departure_input);			
			
			var calendar_group = document.createElement("div");			
			calendar_group.appendChild(arrival_group);
			calendar_group.appendChild(departure_group);			

			// status

			var status_group = document.createElement("div");
			status_group.setAttribute("class", "form-group");

			var status_label = document.createElement("label");
			status_label.setAttribute("for", "calendar-status");
			status_label.appendChild(document.createTextNode("status"));
			
			var status_input = document.createElement("select");
			status_input.setAttribute("id", "calendar-status");
			status_input.setAttribute("name", "calendar-status");			
			status_input.setAttribute("class", "trips-status form-control");

			for (var i in status){

				var option = document.createElement("option");
				option.setAttribute("value", i);
				option.appendChild(document.createTextNode(status[i]));

				// see notes below
				
				if ((trip) && (trip["status_id"] == i)){
					option.setAttribute("selected", "selected");
				}
				
				status_input.appendChild(option);
			}
			
			status_group.appendChild(status_label);
			status_group.appendChild(status_input);			
			
			// notes

			var notes_group = document.createElement("div");
			notes_group.setAttribute("class", "form-group");

			var notes_label = document.createElement("label");
			notes_label.setAttribute("for", "calendar-notes");
			notes_label.appendChild(document.createTextNode("notes"));

			var notes_input = document.createElement("textarea");
			notes_input.setAttribute("id", "calendar-notes");
			notes_input.setAttribute("name", "calendar-notes");
			
			notes_group.appendChild(notes_label);
			notes_group.appendChild(notes_input);
			
			// save button (onclick defined below)

			var button = document.createElement("button");
			button.setAttribute("class", "btn btn-primary");
			button.appendChild(document.createTextNode("Save trip"));
			
			// form

			var trip_form = document.createElement("form");
			trip_form.setAttribute("id", "trip-form");
			trip_form.setAttribute("class", "form");
			
			trip_form.appendChild(dest_group);
			trip_form.appendChild(calendar_group);
			trip_form.appendChild(status_group);
			trip_form.appendChild(notes_group);			
			trip_form.appendChild(button);			

			if (trip){

				trip_form.setAttribute("data-trip-id", trip["id"]);
				
				dest_input.value = trip["name"];
				dest_input.setAttribute("data-wof-id", trip["wof_id"]);

				arrival_input.value = trip["arrival"];
				departure_input.value = trip["departure"];

				// status_id is updated above because I am not sure
				// how to do that here... (20170709/thisisaaronland)
				
				notes_input.value = trip["notes"];				
			}

			// onclick

			button.onclick = function(e){

				try {

					var form = document.getElementById("trip-form");
					var trip_id = form.getAttribute("data-trip-id");
					
					var dest_el = document.getElementById("destination");
					var name = dest_el.value;
					var wof_id = dest_el.getAttribute("data-wof-id");

					var arrival_el = document.getElementById("calendar-arrival");
					var arrival = arrival_el.value;
					
					var departure_el = document.getElementById("calendar-departure");
					var departure = departure_el.value;
					
					var status_el = document.getElementById("calendar-status");
					var status_id = status_el.value;
					
					var notes_el = document.getElementById("calendar-notes");
					var notes = notes_el.value;
					
					var tr = {
						'name': name,
						'wof_id': wof_id,
						'arrival': arrival,
						'departure': departure,
						'status_id': status_id,
						'notes': notes,
					};

					if (trip_id){
						self.update_trip({"id": trip_id}, tr, self.show_trips);
					} else {
						self.save_trip(tr);
					}
				}

				catch(e){
					console.log(e);
				}
				
				return false;
			};
			
			return trip_form;
		},

		'save_trip': function(trip){

			self.add_trip(trip, function(err){
				
				if (err){
					console.log(err);
					return false;
				}

				var wof_id = trip["wof_id"];

				setTimeout(function(){
					var places = require("./mapzen.whosonfirst.bookmarks.places.js");
					
					places.fetch_place(wof_id, function(pl){
						console.log("FETCH PLACE");
						places.save_place(pl, function(e){
							console.log("SAVE PLACE");
							console.log(e);
						});
					});
				}, 10);
				
				var trip_id = this.lastID;
				self.show_trips();
			});
			
		},
		
		'add_trip': function(trip, cb){

			var wof_id = trip["wof_id"];
			var name = trip["name"];			
			var arrival = trip["arrival"];
			var departure = trip["departure"];
			var status_id = trip["status_id"];
			var notes = trip["notes"];			
			
			var sql = "INSERT INTO trips (wof_id, name, arrival, departure, status_id, notes) VALUES (?, ?, ?, ?, ?, ?)";
			var params = [ wof_id, name, arrival, departure, status_id, notes ];

			conn.run(sql, params, cb);
		},

		'update_trip': function(trip, update, cb){

			var trip_id = trip["id"];

			var changes = [];			
			var params = [];

			for (var k in update){
				var v = update[k];
				changes.push(k + " = ?");
				params.push(v);
			};

			params.push(trip_id);

			changes = changes.join(",");

			var sql = "UPDATE trips SET " + changes + " WHERE id = ?";
			
			conn.run(sql, params, cb);
		},

		'remove_trip': function(trip_id, cb){

			var sql = "DELETE FROM trips WHERE id = ?";
			var params = [ trip_id ];

			conn.run(sql, params, cb);
		}
	}

	return self;
}));
