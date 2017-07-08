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
		},

		'render_trips_list': function(rows){

			var count = rows.length;
			
			var list = document.createElement("ul");

			for (var i=0; i < count; i++){

				var trip = rows[i];

				var dest = document.createElement("span");
				dest.setAttribute("data-wof-id", trip["wof_id"]);
				dest.appendChild(document.createTextNode(trip["name"]));

				var dates = document.createElement("span");
				dates.appendChild(document.createTextNode(trip["arrival"] + " - " + trip["departure"]));

				var item = document.createElement("li");
				item.appendChild(dest);
				item.appendChild(dates);
				
				list.appendChild(item);
			}

			return list;
		},
		
		'show_trip': function(trip){

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
				"layer": layers,
				"params": params,
				"panToPoint": false,
			};
			
			var geocoder = L.Mapzen.geocoder();
			geocoder.addTo(map, opts);

			// https://github.com/mapzen/leaflet-geocoder#events
			
			geocoder.on('select', function(e) {

				var feature = e.feature;
				
				if (! feature){
					return;
				}
				
				var bbox = feature['bbox'];
				var props = feature['properties'];

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

			var notes_text = document.createElement("textarea");

			notes_group.appendChild(notes_label);
			notes_group.appendChild(notes_text);
			
			// save button

			var button = document.createElement("button");
			button.setAttribute("class", "btn btn-primary");
			button.appendChild(document.createTextNode("Save trip"));

			button.onclick = function(e){

				try {
					var dest_el = document.getElementById("destination");
					var name = dest_el.value;
					var wof_id = dest_el.getAttribute("data-wof-id");

					var arrival_el = document.getElementById("calendar-arrival");
					var arrival = arrival_el.value;
					
					var departure_el = document.getElementById("calendar-departure");
					var departure = departure_el.value;
					
					var status = document.getElementById("calendar-status");
					var status_id = status.value;
					
					var notes = "";
					
					var tr = {
						'name': name,
						'wof_id': wof_id,
						'arrival': arrival,
						'departure': departure,
						'status_id': status_id,
						'notes': notes,
					};

					self.add_trip(tr, function(err){

						if (err){
							console.log(err);
							return false;
						}

						var trip_id = this.lastID;
						self.show_trips();
					});
					
				}

				catch(e){

					console.log(e);
				}
				
				return false;
			};
			
			// form

			var trip_form = document.createElement("form");
			trip_form.setAttribute("class", "form");
			
			trip_form.appendChild(dest_group);
			trip_form.appendChild(calendar_group);
			trip_form.appendChild(status_group);
			trip_form.appendChild(notes_group);			
			trip_form.appendChild(button);			
			
			return trip_form;
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
		}
	}

	return self;
}));
