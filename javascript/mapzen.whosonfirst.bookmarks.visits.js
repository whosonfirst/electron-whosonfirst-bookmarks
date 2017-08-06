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
	const feelings = require("./mapzen.whosonfirst.bookmarks.feelings.js");	

	const places = require("./mapzen.whosonfirst.bookmarks.places.js");
	
	const namify = require("./mapzen.whosonfirst.bookmarks.namify.js");
	const maps = require("./mapzen.whosonfirst.bookmarks.maps.js");	
	const geojson = require("./mapzen.whosonfirst.bookmarks.geojson.js");
	const fb = require("./mapzen.whosonfirst.bookmarks.feedback.js");	

	const utils = require("./mapzen.whosonfirst.utils.js");
	
	var self = {
		
		'init': function(){
			
		},

		'show_visit': function(id){

			var cb = function(err, row){

				if (err){
					fb.error(err);
					return false;
				}

				self.draw_visit(row);
			};

			self.get_visit(id, cb);
		},

		'draw_visit': function(row){

			var wof_id = row["wof_id"];
			
			var visit = self.render_visit(row);
			
			var left_panel = document.createElement("div");
			left_panel.setAttribute("class", "col-md-6 panel panel-left");

			var right_panel = document.createElement("div");
			right_panel.setAttribute("class", "col-md-6 panel panel-right");

			var map_el = document.createElement("div");
			map_el.setAttribute("id", "map");
			
			left_panel.appendChild(map_el);
			right_panel.appendChild(visit);

			canvas.reset();			
			canvas.append(left_panel);
			canvas.append(right_panel);			

			var map = maps.new_map(map_el);
			geojson.add_visit_to_map(map, row);
			
			namify.translate();

			var places = require("./mapzen.whosonfirst.bookmarks.places.js");
			
			places.get_place(wof_id, function(err, row){

				if (err){
					fb.error(err);
					return;
				}

				var pl = JSON.parse(row["body"]);
				var address = places.render_address(pl);
				var dates = places.render_dates(pl);				

				var details = document.getElementById("place-details-" + wof_id);
				details.appendChild(address);
				details.appendChild(dates);				

				namify.translate();				
			});
		},

		'render_visit': function(row){
			
			var id = row["id"];
			var wof_id = row["wof_id"];
			
			var wrapper = document.createElement("div");

			var place = document.createElement("span");
			place.setAttribute("class", "namify click-me");
			place.setAttribute("data-wof-id", wof_id);			
			place.appendChild(document.createTextNode(wof_id));

			place.onclick = function(e){
				
				var el = e.target;
				var wof_id = el.getAttribute("data-wof-id");

				var places = require("./mapzen.whosonfirst.bookmarks.places.js");
				places.show_place(wof_id);
			};
			
			var h2 = document.createElement("h2");
			h2.appendChild(place);

			var dt = document.createElement("span");
			dt.setAttribute("class", "datetime");
			dt.appendChild(document.createTextNode(row["date"]));

			var feelings_id = row["feelings_id"];
			var feelings = feelings.id_to_label(feelings_id);

			var q = document.createElement("q");
			q.setAttribute("class", "click-me");
			q.appendChild(document.createTextNode(feelings));

			var desc = self.render_visit_description(row, function(e){

				var uw = document.getElementById("update-visit-wrapper");
				var display = uw.style.display;

				display = (display == "none") ? "block" : "none";
				uw.style.display = display;
				
				return false;
			});
			
			var p = document.createElement("p");
			p.appendChild(desc);

			var place_details = document.createElement("div");
			place_details.setAttribute("id", "place-details-" + wof_id);
			
			wrapper.appendChild(h2);
			wrapper.appendChild(place_details);
			wrapper.appendChild(p);			

			var update_wrapper = document.createElement("div");
			update_wrapper.setAttribute("id", "update-visit-wrapper");

			update_wrapper.style.display = "none";
			
			var update_header = document.createElement("h3");
			update_header.appendChild(document.createTextNode("Update this visit"));

			var cb = function(e){

				var feels = document.getElementById("feelings");
				var feelings_id = feels.value;

				var dt = new Date;
				dt = dt.toISOString();
				
				var update = {
					"feelings_id" : feelings_id,
					"date": dt
				};

				self.update_visit(row, update, function(r){
					self.show_visit(row["id"]);
				});
			};
			
			var select = feelings.render_menu(feelings_id, cb);

			update_wrapper.appendChild(update_header);			
			update_wrapper.appendChild(select);

			wrapper.appendChild(update_wrapper);
			
			var details = utils.render_object(row);
			var details_wrapper = utils.render_expandable(details);
			
			wrapper.appendChild(details_wrapper);

			return wrapper;
		},

		'render_visit_description': function(row, cb){

			if (! cb){
				
				cb = function(e){
					var el = e.target;
					var feelings_id = el.getAttribute("data-feelings-id");
					feelings.show_feelings(feelings_id);
				};
			}
			
			var id = row["id"];

			var feelings_id = row["feelings_id"];
			var feels = feelings.id_to_label(feelings_id);

			var q = document.createElement("q");
			q.setAttribute("class", "click-me");
			q.setAttribute("data-feelings-id", feelings_id);

			q.appendChild(document.createTextNode(feels));

			q.onclick = cb;
		
			var desc = document.createElement("span");
			desc.setAttribute("id", "visit-description-" + id);
			desc.setAttribute("class", "visit-description");			
			
			desc.appendChild(document.createTextNode("You said "));
			desc.appendChild(q);
			desc.appendChild(document.createTextNode(" on or around "));
			
			var date = document.createElement("span");
			date.setAttribute("class", "datetime click-me");
			date.setAttribute("data-visit-id", row["id"]);
			date.appendChild(document.createTextNode(row['date']));
			
			date.onclick = function(e){
				
				var el = e.target;
				var id = el.getAttribute("data-visit-id");
				
				self.show_visit(id);
				return;
			};
			
			desc.appendChild(date);
			
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

			desc.appendChild(remove);
			return desc;
		},
		
		'get_visit': function(id, cb){

			var sql = "SELECT * FROM visits WHERE id = ?";
			var params = [ id ];
			conn.get(sql, params, cb);
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

		'render_visits': function(rows, more){

			if (! more){
				more = {};
			}

			var skip_header = (more["skip_header"]) ? true : false;
			
			var count = rows.length;
			
			var list = document.createElement("ul");
			list.setAttribute("class", "list visits-list");
			
			for (var i=0; i < count; i++){
				
				var row = rows[i];

				var lat = row['latitude'];
				var lon = row['longitude'];
				
				var locality_id = row['locality_id'];
				
				var feelings_id = row['feelings_id'];
				var feels = feelings.id_to_label(feelings_id);
				
				var q = document.createElement("q");
				q.appendChild(document.createTextNode(feels));

				var span = document.createElement("span");
				span.setAttribute("class", "place-name click-me");
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
					loc.setAttribute("class", "place-name-locality namify click-me");
					loc.setAttribute("id", "place-locality-" + locality_id);
					loc.setAttribute("data-wof-id", locality_id);					
					loc.appendChild(document.createTextNode(locality_id));

					span.appendChild(loc);
				}

				var desc = self.render_visit_description(row);

				var sm = document.createElement("small");				
				sm.appendChild(desc);
				
				var item = document.createElement("li");
				item.setAttribute("class", "visits-list-item");
				item.setAttribute("data-latitude", lat);
				item.setAttribute("data-longitude", lon);
				item.setAttribute("data-feelins-label", feels);
				item.setAttribute("data-name", row["name"]);				
				
				if (! skip_header){
					item.appendChild(span);
				}
				
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

			var visit_rows = [];
			
			for (var i=0; i < count; i++){

				var el = items[i];
				
				var lat = el.getAttribute("data-latitude");
				var lon = el.getAttribute("data-longitude");				

				lat = parseFloat(lat);
				lon = parseFloat(lon);				
				
				var name = el.getAttribute("data-name");
				// var feelings = el.getAttribute("feelings");

				var row = {
					"latitude": lat,
					"longitude": lon,
					"name": name
				};

				visit_rows.push(row);
			}
			
			var left_panel = document.createElement("div");
			left_panel.setAttribute("class", "col-md-6 panel panel-left");
			
			var right_panel = document.createElement("div");
			right_panel.setAttribute("class", "col-md-6 panel panel-right");
							
			var map_el = document.createElement("div");
			map_el.setAttribute("id", "map");
				
			left_panel.appendChild(map_el);			
			right_panel.appendChild(visits);

			canvas.reset();
			canvas.append(left_panel);
			canvas.append(right_panel);

			var map = maps.new_map(map_el);
			
			geojson.add_visits_to_map(map, visit_rows);
			
			namify.translate();
		},

		'add_visit': function(pl, feelings_id, cb){

			var on_save = function(err){

				places.save_place(pl);
				places.save_hierarchy(pl);

				cb(err);
			};

			self.save_visit(pl, feelings_id, on_save);
		},

		'update_visit': function(visit, update, cb){

			var where = [];
			var params = [];

			for (var k in update){
				where.push(k + " = ?")
				params.push(update[k])
			}

			where = where.join(",");
			
			var sql = "UPDATE visits SET " + where + " WHERE id = ?";
			params.push(visit["id"]);

			conn.run(sql, params, cb);
		},
		
		'save_visit': function(pl, feelings_id, cb){

			var wof_id = pl['wof:id'];
			var name = pl['wof:name'];			
			var lat = pl['geom:latitude'];
			var lon = pl['geom:longitude'];			

			var hier = pl['wof:hierarchy'];
			hier = hier[0];				// PLEASE FIX ME

			var neighbourhood_id = 0;
			var macrohood_id = 0;		
			var locality_id = 0;
			var metroarea_id = 0;			
			var region_id = 0;
			var country_id = 0;

			if (hier){
				neighbourhood_id = hier['neighbourhood_id'];
				macrohood_id = hier['macrohood_id'];				
				locality_id = hier['locality_id'];
				region_id = hier['region_id'];
				country_id = hier['country_id'];			
			}
			
			var dt = new Date;
			dt = dt.toISOString();

			var sql = "INSERT INTO visits (wof_id, name, latitude, longitude, neighbourhood_id, macrohood_id, locality_id, metroarea_id, region_id, country_id, feelings_id, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
			
			var params = [wof_id, name, lat, lon, neighbourhood_id, macrohood_id, locality_id, metroarea_id, region_id, country_id, feelings_id, dt];

			conn.run(sql, params, cb);
		},

		'remove_visit': function(visit_id, cb){

			var sql = "DELETE FROM visits WHERE id = ?";
			var params = [ visit_id ];

			conn.run(sql, params, cb);
		},

		'get_visits_for_neighbourhood': function(wof_id, cb){

			var sql = "SELECT * FROM visits WHERE neighbourhood_id = ? ORDER BY date DESC";
			var params = [ wof_id ];

			conn.all(sql, params, cb);
		},
		
		'get_visits_for_locality': function(wof_id, cb){

			var sql = "SELECT * FROM visits WHERE locality_id = ? ORDER BY date DESC";
			var params = [ wof_id ];

			conn.all(sql, params, cb);
		},

		'get_visits_for_region': function(wof_id, cb){

			var sql = "SELECT * FROM visits WHERE region_id = ? ORDER BY date DESC";
			var params = [ wof_id ];

			conn.all(sql, params, cb);
		},

		'get_visits_for_country': function(wof_id, cb){

			var sql = "SELECT * FROM visits WHERE country_id = ? ORDER BY date DESC";
			var params = [ wof_id ];

			conn.all(sql, params, cb);
		},

		'get_visits_for_feelings': function(feelings_id, cb){

			var sql = "SELECT * FROM visits WHERE feelings_id = ? ORDER BY date DESC";
			var params = [ feelings_id ];

			conn.all(sql, params, cb);
		},

		'get_visits_for_place': function(wof_id, cb){

			var sql = "SELECT * FROM visits WHERE wof_id = ? ORDER BY date DESC";
			var params = [ wof_id ];

			conn.all(sql, params, cb);			
		},
		
		'get_visits_for_feelings_and_place': function(feelings_id, wof_id, cb){

			var places = require("./mapzen.whosonfirst.bookmarks.places.js");
			
			places.get_place(wof_id, function(err, row){

				if (err){
					cb(err);
					return false;
				}

				var pl = JSON.parse(row["body"]);
				var pt = pl["wof:placetype"];

				// PLEASE PUT ME IN A FUNCTION OR SOMETHING...
				
				if ((pt != "venue") && (pt != "neighbourhood") && (pt != "locality") && (pt != "region") && (pt != "country")){
					cb("Invalid placetype");
					return;
				}
				
				var col = pt + "_id";
				
				var sql = "SELECT * FROM visits WHERE feelings_id = ? AND " + col + " = ? ORDER BY date DESC";
				var params = [ feelings_id, wof_id ];
				
				conn.all(sql, params, cb);
			});
		},

		'get_count_for_feelings': function(feelings_id, cb){

			var sql = "SELECT COUNT(DISTINCT(locality_id)) AS count_feelings FROM visits WHERE feelings_id = ?";
			var params = [ feelings_id ];

			conn.get(sql, params, cb);
		},
		
		'get_localities_for_feelings': function(feelings_id, cb){

			var sql = "SELECT locality_id, feelings_id, COUNT(id) AS count_visits FROM visits WHERE feelings_id = ? GROUP BY locality_id ORDER BY count_visits DESC";
			var params = [ feelings_id ];

			conn.all(sql, params, cb);
		},

	}

	return self;
}));
