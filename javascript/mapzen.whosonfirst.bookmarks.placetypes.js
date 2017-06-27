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

	const desires = require("./mapzen.whosonfirst.bookmarks.desires.js");	
	const namify = require("./mapzen.whosonfirst.bookmarks.namify.js");
	const geojson = require("./mapzen.whosonfirst.bookmarks.geojson.js");
	const maps = require("./mapzen.whosonfirst.bookmarks.maps.js");	

	const fb = require("./mapzen.whosonfirst.bookmarks.feedback.js");
	const utils = require("./mapzen.whosonfirst.utils.js");
	
	var self = {
		
		'init': function(){
		},

		'show_neighbourhoods_for_locality': function(wof_id){

			self.get_neighbourhoods_for_locality(wof_id, function(err, rows){

				var span = document.createElement("span");
				span.setAttribute("class", "namify click-me");
				span.setAttribute("data-wof-id", wof_id);
				span.appendChild(document.createTextNode(wof_id));

				span.onclick = function(e){

					var el = e.target;
					var wof_id = el.getAttribute("data-wof-id");

					var places = require("./mapzen.whosonfirst.bookmarks.places.js");
					places.show_place(wof_id);
				};
				
				var header = document.createElement("h4");
				header.appendChild(document.createTextNode("Neighbourhoods in "));
				header.appendChild(span);
				
				var neighbourhoods = self.render_neighbourhoods_for_locality(rows);

				var left_panel = document.createElement("div");
				left_panel.setAttribute("class", "col-md-6 panel panel-left");
				
				var right_panel = document.createElement("div");
				right_panel.setAttribute("class", "col-md-6 panel panel-right");
				
				var map_el = document.createElement("div");
				map_el.setAttribute("id", "map");
				
				left_panel.appendChild(map_el);
				
				right_panel.appendChild(header);				
				right_panel.appendChild(neighbourhoods);
				
				canvas.reset();
				canvas.append(left_panel);
				canvas.append(right_panel);

				namify.translate();
			});
		},

		'render_neighbourhoods_for_locality': function(rows){

			var list = document.createElement("ul");
			list.setAttribute("class", "list");
			
			var count_rows = rows.length;

			for (var i=0; i < count_rows; i++){

				var row = rows[i];
				var wof_id = row["wof_id"];

				if (! wof_id){
					continue;
				}
				
				var item = document.createElement("li");
				item.setAttribute("class", "namify click-me");
				item.setAttribute("data-wof-id", wof_id);
				item.appendChild(document.createTextNode(wof_id));

				item.onclick = function(e){

					var el = e.target;
					var wof_id = el.getAttribute("data-wof-id");

					var places = require("./mapzen.whosonfirst.bookmarks.places.js");
					places.show_place(wof_id);
				};
				
				list.appendChild(item);
			}

			return list;
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
			var counts = {};
			
			var places = document.createElement("ul");
			places.setAttribute("class", "list placetype-list");
			
			for (var i=0; i < count; i++){
				
				var row = rows[i];
				var wof_id = row['wof_id'];
				var count_visits = row['count_visits'];				

				var item = document.createElement("li");
				item.setAttribute("id", "placetype-list-item-" + wof_id);
				item.setAttribute("class", "list placetype-list-item");
				
				var place = document.createElement("span");
				
				if (wof_id){

					ids.push(wof_id);
					
					place.setAttribute("class", "place-name namify click-me");

					if (pt == "neighbourhood"){
						place.setAttribute("id", "neighbourhood-" + wof_id);
						utils.append_class(place, "localityify");
					}
					
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
				sm.setAttribute("id", "placetype-mentions-" + wof_id);				
				sm.appendChild(document.createTextNode("you've mentioned stuff here"));
				
				var visits = document.createElement("span");
				visits.setAttribute("class", "placetype-count click-me hey-look");
				visits.setAttribute("data-wof-id", wof_id);
				
				if (count_visits == 1){
					visits.appendChild(document.createTextNode(" once"));
				}

				else {
					visits.appendChild(document.createTextNode(" " + count_visits + " times"));
				}

				visits.onclick = function(e){

					var el = e.target;
					var wof_id = el.getAttribute("data-wof-id");

					var places = require("./mapzen.whosonfirst.bookmarks.places.js");
					places.show_place(wof_id);					
				};

				sm.appendChild(visits);
				item.appendChild(sm);
				
				places.appendChild(item);

				// we need this below to determine whether to count neighbourhoods
				// for a locality (20170620/thisisaaronland)
				
				counts[wof_id] = count_visits;
			}

			var left_panel = document.createElement("div");
			left_panel.setAttribute("class", "col-md-6 panel panel-left");
			
			var right_panel = document.createElement("div");
			right_panel.setAttribute("class", "col-md-6 panel panel-right");
							
			var map_el = document.createElement("div");
			map_el.setAttribute("id", "map");
				
			left_panel.appendChild(map_el);			
			right_panel.appendChild(places);

			canvas.reset();
			canvas.append(left_panel);
			canvas.append(right_panel);

			// start of OH GOD PUT ME IN A FUNCTION OR SOMETHING...
			
			var els = document.getElementsByClassName("localityify");
			var els_count = els.length;

			var places = require("./mapzen.whosonfirst.bookmarks.places.js");
			
			for (var i=0; i < els_count; i++){

				var el = els[i];
				var wof_id = el.getAttribute("data-wof-id");

				if (wof_id == -1){
					continue;
				}

				places.get_place(wof_id, function(err, row){

					if (err){
						return;
					}

					var pl = JSON.parse(row["body"]);

					var neighbourhood_id = pl["wof:id"];
					
					var hier = pl["wof:hierarchy"];
					hier = hier[0];		// please fix me...

					if (! hier["locality_id"]){
						return;
					}

					var loc_id = hier["locality_id"];
					
					places.get_place(loc_id, function(err, row){

						var loc_pl = JSON.parse(row["body"]);

						var loc_id = loc_pl["wof:id"];						
						var loc_name = loc_pl["wof:name"];

						var loc_span = document.createElement("span");
						loc_span.setAttribute("class", "click-me");
						loc_span.setAttribute("data-wof-id", loc_id);						
						
						loc_span.appendChild(document.createTextNode(loc_name));

						loc_span.onclick = function(e){
							var el = e.target;
							var wof_id = el.getAttribute("data-wof-id");
							places.show_place(wof_id);
						};

						var hood_span = document.getElementById("neighbourhood-" + neighbourhood_id);
						hood_span.appendChild(document.createTextNode(", in "));
						hood_span.appendChild(loc_span);
					});
				});

			}

			var map = maps.new_map(map_el);

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

					var feature_collection = {
						"type": "FeatureCollection",
						"features": features,
					};

					geojson.add_featurecollection_to_map(map, feature_collection);
				};

				conn.all(sql, params, cb);

				for (var i=0; i < count_ids; i++){

					self.get_desires_for_placetype(pt, ids[i], self.draw_desires_for_placetype);
					
					if ((pt == "locality") && (counts[ids[i]] > 1)){
						self.get_neighbourhood_count_for_locality(ids[i], self.draw_neighbourhood_count_for_locality);
					}

					if (pt == "neighbourhood"){
						// self.get_locality_for_neighbourhood(ids[i]);
					}
				}
				
			}
			
			namify.translate();			
		},

		'get_neighbourhood_count_for_locality': function(wof_id, cb){

			var sql = "SELECT COUNT(DISTINCT(neighbourhood_id)) AS count_neighbourhoods FROM visits WHERE locality_id = ?";
			var params = [ wof_id ];

			conn.get(sql, params, function(err, row){

				if (! err){
					row["wof_id"] = wof_id;
				}

				cb(err, row);
			});
		},

		'draw_neighbourhood_count_for_locality': function(err, row){

			if (err){
				fb.error(err);
				return false;
			}

			var wof_id = row["wof_id"];
			var count_hoods = row["count_neighbourhoods"];

			var mentions = document.getElementById("placetype-mentions-" + wof_id);

			var show_neighbourhoods = function(e){
				
				var el = e.target;
				var wof_id = el.getAttribute("data-wof-id");

				self.show_neighbourhoods_for_locality(wof_id);
			};
			
			if (count_hoods == 1){

				var span = document.createElement("span");
				span.setAttribute("class", "hey-look click-me");
				span.setAttribute("data-wof-id", wof_id);
				span.appendChild(document.createTextNode("one neighbourhood"));				

				span.onclick = show_neighbourhoods;
					
				mentions.appendChild(document.createTextNode(" in "));
				mentions.appendChild(span);
			}

			else {

				var span = document.createElement("span");
				span.setAttribute("class", "hey-look click-me");
				span.setAttribute("data-wof-id", wof_id);				
				span.appendChild(document.createTextNode(count_hoods + " neighbourhoods"));

				span.onclick = show_neighbourhoods;
				
				mentions.appendChild(document.createTextNode(" spanning "));
				mentions.appendChild(span);				
			}
		},
		
		// maybe put this in a different package... (20170620/thisisaaronland)
		
		'get_desires_for_placetype': function(pt, wof_id, cb){

			var col = pt + "_id";
			
			var sql = "SELECT status_id, COUNT(id) AS count_visits FROM visits WHERE " + col + " = ? GROUP BY status_id ORDER BY count_visits DESC";
			var params = [ wof_id ];

			console.log(sql, params);
			
			conn.all(sql, params, function(err, rows){

				if (! err){

					var count_rows = rows.length;
					
					for (var i=0; i < count_rows; i++){
						rows[i]['wof_id'] = wof_id;
					}
				}

				cb(err, rows);
			});
		},
		
		'draw_desires_for_placetype': function(err, rows){

			if (err){
				fb.error(err);
				return false;
			}

			var count_rows = rows.length;

			if (! count_rows){
				return;
			}

			var first = rows[0];
			var wof_id = first["wof_id"];
			
			var desires_list = self.render_desires_for_placetype(rows);

			var place = document.getElementById("placetype-list-item-" + wof_id);
			place.appendChild(desires_list);
		},

		'render_desires_for_placetype': function(rows){

			// TO DO: group desires by count in a single list item
			// as in "<q>again</a> and <q>meh</q> twice" rather than
			// "<q>again</a> twice and <q>meh</q> twice"
			
			var wof_id;

			var desires_list = document.createElement("ul");
			desires_list.setAttribute("class", "list-inline placetype-desires");

			var count_rows = rows.length;

			for (var i=0; i < count_rows; i++){

				var row = rows[i];
				wof_id = row["wof_id"];

				var status_id = row["status_id"];
				var count_visits = row["count_visits"];

				var desire = desires.id_to_label(status_id);

				var item = document.createElement("li");
				item.setAttribute("class", "placetype-desires-item");
				
				var q = document.createElement("q");
				q.setAttribute("data-wof-id", wof_id);				
				q.setAttribute("data-status-id", status_id);
				q.setAttribute("class", "desire click-me");
				q.appendChild(document.createTextNode(desire));

				q.onclick = function(e){

					var el = e.target;
					var wof_id = el.getAttribute("data-wof-id");					
					var status_id = el.getAttribute("data-status-id");
					
					var desires = require("./mapzen.whosonfirst.bookmarks.desires.js");
					desires.show_desires_for_place(status_id, wof_id);
				};
				
				item.append(q);				
				
				if (count_visits == 1){

					if (count_rows > 1){
						item.appendChild(document.createTextNode(" once"));
					}
				}

				else if (count_visits == 2){
					item.appendChild(document.createTextNode(" twice"));
				}
				
				else {
					item.appendChild(document.createTextNode(" " + count_visits + " times"));
				}

				desires_list.appendChild(item);
			}

			return desires_list;
		},

		'get_neighbourhoods_for_locality': function(wof_id, cb){

			var sql = "SELECT DISTINCT(neighbourhood_id) AS wof_id, COUNT(id) AS count_visits FROM visits WHERE locality_id = ? GROUP BY wof_id ORDER BY count_visits DESC";
			var params = [ wof_id ];

			conn.all(sql, params, cb);
		}
		
	}

	return self;
}));
