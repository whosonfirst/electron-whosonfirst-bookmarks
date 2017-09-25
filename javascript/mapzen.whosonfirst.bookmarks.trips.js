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

	const utils = require("./mapzen.whosonfirst.utils.js");	
	const feelings = require("./mapzen.whosonfirst.bookmarks.feelings.js");
	const visits = require("./mapzen.whosonfirst.bookmarks.visits.js");		
	
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

				console.log("TRIPS", rows);
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
				tmp[ wof_id ] = 1;
			}

			var places = [];

			for (var wof_id in tmp){
				places.push(wof_id);
			}

			if (places.length == 1){

				var wof_id = places[0];

				// see the way we're redeclaring the places variable? we probably
				// shouldn't do this but today we are... (20170902/thisisaaronland)
				
				var places = require("./mapzen.whosonfirst.bookmarks.places.js");
				
				places.fetch_place(wof_id, function(pl){
					geojson.add_place_to_map(map, pl);
				});

				return;
			}
			
			var sql = "SELECT * FROM places WHERE wof_id in (" + places.join(",") + ")";
			var params = [];
			
			conn.all(sql, params, function(err, rows){

				if (err){
					console.log(err);
					return;
				}

				// TO CHECK THAT rows.length == places.length
				// and do... something if not
				// console.log("WTF", rows.length);
				
				var featurecollection = geojson.trips_to_featurecollection(rows);
				geojson.add_featurecollection_to_map(map, featurecollection);
			});
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
				dest.setAttribute("title", "edit this trip");
				dest.appendChild(document.createTextNode(trip["name"]));

				dest.onclick = function(e){
					
					var el = e.target;
					var trip_id = el.getAttribute("data-trip-id");

					self.show_trip(trip_id);
					return false;
				};

				var dest_all = document.createElement("span");
				dest_all.setAttribute("class", "trips-list-item-destination-all click-me");
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
				remove.setAttribute("title", "remove this trip");
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
				status_el.setAttribute("title", "only show trips that are " + status_label);
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
		
		'draw_trip': function(trip, edit){			
			
			var left_panel = document.createElement("div");
			left_panel.setAttribute("class", "col-md-6 panel panel-left");

			var right_panel = document.createElement("div");
			right_panel.setAttribute("class", "col-md-6 panel panel-right");

			var map_el = document.createElement("div");
			map_el.setAttribute("id", "map");
			
			left_panel.appendChild(map_el);

			if ((! trip) || (edit)){
				var edit_form = self.render_edit_trip(trip);			
				right_panel.appendChild(edit_form);
			}

			else {
				var details = self.render_trip(trip);
				right_panel.appendChild(details);				
			}
			
			canvas.reset();			
			canvas.append(left_panel);
			canvas.append(right_panel);			

			var arrival_picker = new Pikaday({
				field: document.getElementById('calendar-arrival'),
				onSelect: function(e) {
				}
			});

			var departure_picker = new Pikaday({
				field: document.getElementById('calendar-departure'),
				onSelect: function(e) {
				}
			});
			
			var map = maps.new_map(map_el);
			
			if (trip){

				var places = require("./mapzen.whosonfirst.bookmarks.places.js");
				var wof_id = trip["wof_id"];
				
				places.fetch_place(wof_id, function(pl){
					geojson.add_place_to_map(map, pl);
				});
				
				return;
			}

			// please do something smarter...
			
			var sw = L.latLng(-50, -150);
			var ne = L.latLng(50, 150);
			
			var bounds = L.latLngBounds(sw, ne);
			var opts = { "padding": [100, 100] };
			
			map.fitBounds(bounds, opts);
			
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
				// this doesn't work well enough to use yet...
				// "url": "https://whosonfirst-api.mapzen.com/pelias/v1",
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

		'render_trip': function(trip){

			var dest_label = document.createElement("span");
			dest_label.setAttribute("class", "click-me");			
			dest_label.setAttribute("data-wof-id", trip["wof_id"]);
			dest_label.appendChild(document.createTextNode(trip["name"]));

			dest_label.onclick = function(e){
				var el = e.target;
				var wof_id = el.getAttribute("data-wof-id");
				
				var places = require("./mapzen.whosonfirst.bookmarks.places.js");				
				places.show_place(wof_id);
			};
			
			var dest_all = document.createElement("small");
			dest_all.setAttribute("class", "trip-details-all click-me");
			dest_all.setAttribute("title", "show all trips to this destination");
			dest_all.setAttribute("data-wof-id", trip["wof_id"]);
			dest_all.appendChild(document.createTextNode("🌐"));
			
			dest_all.onclick = function(e){
				var el = e.target;
				var wof_id = el.getAttribute("data-wof-id");
				self.show_trips_for_place(wof_id);
			};

			var status_label = document.createElement("div");
			status_label.setAttribute("class", "trip-details-status");
			status_label.appendChild(document.createTextNode(status[trip["status_id"]]));
			
			var header = document.createElement("h3");
			header.setAttribute("class", "trip-details-header");
			header.appendChild(dest_label);
			header.appendChild(dest_all);
			header.appendChild(status_label);			
			
			var arrival = document.createElement("li");
			arrival.setAttribute("id", "trip-arrival");			
			arrival.setAttribute("class", "trip-details-arrival");
			arrival.appendChild(document.createTextNode(trip["arrival"]));

			var departure = document.createElement("li");
			departure.setAttribute("class", "trip-details-departure");			
			departure.appendChild(document.createTextNode(trip["departure"]));

			var dates = document.createElement("ul");
			dates.setAttribute("class", "list-inline trip-details-dates");
			dates.appendChild(arrival);
			dates.appendChild(departure);			
			
			var notes = document.createElement("div");
			notes.setAttribute("class", "trip-details-notes");
			notes.appendChild(document.createTextNode(trip["notes"]));

			var feelings_wrapper = document.createElement("div");
			feelings_wrapper.setAttribute("class", "trip-details-feelings");
			feelings_wrapper.setAttribute("data-wof-id", trip["wof_id"]);

			var show_feelings = [
				2,	// I want to go there
				8,	// I would try this
			];

			for (var idx in show_feelings){

				var feelings_id = show_feelings[idx];
				
				visits.get_visits_for_feelings_and_place(feelings_id, trip["wof_id"], function(err, rows){

					if (err){
						return false;
					}

					var feelings_list = document.createElement("ul");
					feelings_list.setAttribute("class", "list trip-details-visits-list");

					var count_rows = rows.length;

					if (! count_rows){
						return;
					}
					
					for (var i = 0; i < count_rows; i++){

						var visit = rows[i];
						// console.log("VISIT", visit);
						
						var name = visit["name"];
						var desc = visits.render_visit_description(visit);
						
						var name_wrapper = document.createElement("div");
						name_wrapper.setAttribute("class", "hey-look click-me trip-details-visits-item-name");
						name_wrapper.setAttribute("data-wof-id", visit["wof_id"]);
						name_wrapper.appendChild(document.createTextNode(name))

						name_wrapper.onclick = function(e){

							var el = e.target;
							var wof_id = el.getAttribute("data-wof-id");

							var places = require("./mapzen.whosonfirst.bookmarks.places.js");
							places.show_place(wof_id);							
						};
						
						var desc_wrapper = document.createElement("div");
						desc_wrapper.setAttribute("class", "trip-details-visits-item-description");
						desc_wrapper.appendChild(desc);
						
						var item = document.createElement("li");
						item.setAttribute("class", "trip-details-visits-item");
						item.appendChild(name_wrapper);
						item.appendChild(desc_wrapper);						

						feelings_list.appendChild(item);
					}

					var feelings_label = feelings.id_to_label(rows[0]["feelings_id"]);
					var args = { "label": feelings_label };
					
					var expandable_wrapper = utils.render_expandable(feelings_list, args);		
					feelings_wrapper.appendChild(expandable_wrapper);
				});

			}
						
			var edit_button = document.createElement("button");
			edit_button.setAttribute("style", "float:right;");
			edit_button.setAttribute("class", "btn");
			edit_button.setAttribute("data-trip-id", trip["id"]);
			edit_button.appendChild(document.createTextNode("Edit this trip"));

			edit_button.onclick = function(e){
				self.draw_trip(trip, true);
			};
			
			var wrapper = document.createElement("div");
			wrapper.setAttribute("class", "trip-details");
			wrapper.setAttribute("data-trip-id", trip["id"]);
			
			wrapper.appendChild(edit_button);			
			wrapper.appendChild(header);
			wrapper.appendChild(dates);
			wrapper.appendChild(notes);
			wrapper.appendChild(feelings_wrapper);
			
			return wrapper;
		},
		
		'render_edit_trip': function(trip){

			// destination

			var dest_group = document.createElement("div");
			dest_group.setAttribute("class", "form-group form-group-trip");
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
			arrival_group.setAttribute("class", "form-group form-group-trip form-group-calendar form-group-calendar-arrival");

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
			departure_group.setAttribute("class", "form-group form-group-trip form-group-calendar form-group-calendar-departure");
			
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
			calendar_group.setAttribute("class", "calendar-group");
			calendar_group.appendChild(arrival_group);
			calendar_group.appendChild(departure_group);			

			// status

			var status_group = document.createElement("div");
			status_group.setAttribute("clear", "all");
			status_group.setAttribute("class", "form-group form-group-trip form-group-status");

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
			notes_group.setAttribute("class", "form-group form-group-trip");

			var notes_label = document.createElement("label");
			notes_label.setAttribute("for", "calendar-notes");
			notes_label.appendChild(document.createTextNode("notes"));

			var notes_input = document.createElement("textarea");
			notes_input.setAttribute("id", "calendar-notes");
			notes_input.setAttribute("name", "calendar-notes");
			
			notes_group.appendChild(notes_label);
			notes_group.appendChild(notes_input);
			
			// save button (onclick defined below)

			var save_button = document.createElement("button");
			save_button.setAttribute("class", "btn btn-primary");
			save_button.appendChild(document.createTextNode("Save trip"));
			
			// form

			var trip_form = document.createElement("form");
			trip_form.setAttribute("id", "trip-form");
			trip_form.setAttribute("class", "form");
			
			trip_form.appendChild(dest_group);
			trip_form.appendChild(calendar_group);
			trip_form.appendChild(status_group);
			trip_form.appendChild(notes_group);			
			trip_form.appendChild(save_button);			

			if (trip){

				// console.log("DRAW TRIP", trip);
				
				trip_form.setAttribute("data-trip-id", trip["id"]);
				
				dest_input.value = trip["name"];
				dest_input.setAttribute("data-wof-id", trip["wof_id"]);

				// we need to pull in timezone data for the locality here...
				
				arrival_input.value = trip["arrival"];			// + " 12:00:00 PDT";
				departure_input.value = trip["departure"];

				// status_id is updated above because I am not sure
				// how to do that here... (20170709/thisisaaronland)
				
				notes_input.value = trip["notes"];

				var delete_button = document.createElement("button");
				delete_button.setAttribute("class", "btn");
				delete_button.appendChild(document.createTextNode("Delete trip"));
				delete_button.setAttribute("data-trip-id", trip["id"]);

				trip_form.appendChild(delete_button);
				
				delete_button.onclick = function(e){

					var el = e.target;
					var id = el.getAttribute("data-trip-id");
				
					if (! confirm("Are you sure you want to delete this trip?")){
						return false;
					}

					self.remove_trip(id, function(){
						self.show_trips();
					});
					
					return false;					
				}
			}

			// onclick

			save_button.onclick = function(e){

				var pikaday_to_ymd = function(el){

					var date = el.value;

					var dt = new Date(date);
					var iso = dt.toISOString();

					iso = iso.split("T");
					return iso[0];
				};
				
				try {

					var form = document.getElementById("trip-form");
					var trip_id = form.getAttribute("data-trip-id");
					
					var dest_el = document.getElementById("destination");
					var name = dest_el.value;
					var wof_id = dest_el.getAttribute("data-wof-id");

					var arrival_el = document.getElementById("calendar-arrival");
					var departure_el = document.getElementById("calendar-departure");

					var arrival = pikaday_to_ymd(arrival_el);
					var departure = pikaday_to_ymd(departure_el);					
					
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

					// console.log("TRIP", tr);
						    
					var cb = function(err, rsp){

						console.log("UPDATE", err, rsp);
						self.show_trips();
					};
					
					if (trip_id){
						self.update_trip({"id": trip_id}, tr, cb);
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

						places.save_place(pl, function(e){
							console.log(e);
						});
					});
				}, 10);
				
				var trip_id = this.lastID;
				trip["id"] = trip_id;
				
				// self.show_trips();
				self.draw_trip(trip);
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

			console.log("TRIP", sql, params);
			
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
