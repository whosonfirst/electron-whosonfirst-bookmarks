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

	const canvas = require("./mapzen.whosonfirst.bookmarks.canvas.js");
	const namify = require("./mapzen.whosonfirst.bookmarks.namify.js");
	const maps = require("./mapzen.whosonfirst.bookmarks.maps.js");	
	const utils = require("./mapzen.whosonfirst.utils.js");		
	
	const desires = {
		0: "i've been there",
		1: "i was there",
		2: "i want to go there",
		3: "again again",
		4: "again",
		5: "again maybe",
		6: "again never",
		7: "meh",
		8: "i would try this",		
	};
	
	var self = {

		'get_list': function(){
			return desires;
		},
		
		'id_to_label': function(id){
			return desires[id];
		},

		'show_desires': function(){

			var left_panel = document.createElement("div");
			left_panel.setAttribute("class", "col-md-12 panel");

			var list = document.createElement("ul");
			list.setAttribute("class", "list desires-list");
			
			for (var status_id in desires){

				var label = desires[status_id];
				
				var item = document.createElement("li");
				list.setAttribute("class", "desires-list-item");
				list.setAttribute("id", "desires-list-item-" + status_id);
				
				var header = document.createElement("h4");
				header.setAttribute("id", "desires-list-item-header-" + status_id);
				
				header.setAttribute("class", "desire desire-list-item-header click-me");
				header.setAttribute("data-status-id", status_id);
				header.appendChild(document.createTextNode(label));

				header.onclick = function(e){

					var el = e.target;
					var status_id = el.getAttribute("data-status-id");

					self.show_desire(status_id);
				};

				var stats_wrapper = document.createElement("div");
				stats_wrapper.setAttribute("id", "desire-stats-wrapper-" + status_id);
				stats_wrapper.setAttribute("class", "desire-stats-wrapper");				
				
				item.appendChild(header);
				item.appendChild(stats_wrapper);
				
				list.appendChild(item);
			}

			left_panel.appendChild(list);
			
			canvas.draw(left_panel);

			for (var status_id in desires){
				self.show_localities_for_desire(status_id);
			}
		},

		'show_localities_for_desire': function(status_id){

			var visits = require("./mapzen.whosonfirst.bookmarks.visits.js");

			visits.get_localities_for_desire(status_id, function(err, rows){

				var stats = self.render_stats(rows);
				
				var stats_wrapper = document.getElementById("desire-stats-wrapper-" + status_id);
				stats_wrapper.appendChild(stats);
				
				namify.translate();	// PLEASE RUN ONCE WITH A WAITGROUP
			});			
		},

		'show_desire': function(status_id){
			
			var map_el = document.createElement("div");
			map_el.setAttribute("id", "map");

			var desire_wrapper = self.render_desire(status_id);
			
			var left_panel = document.createElement("div");
			left_panel.setAttribute("class", "col-md-6 panel panel-left");

			var right_panel = document.createElement("div");
			right_panel.setAttribute("class", "col-md-6 panel panel-right");

			left_panel.appendChild(map_el);
			
			right_panel.appendChild(desire_wrapper);
			
			canvas.reset();
			canvas.append(left_panel);
			canvas.append(right_panel);			

			var map = maps.new_map(map_el);

			self.show_localities_for_desire(status_id);

			var visits = require("./mapzen.whosonfirst.bookmarks.visits.js");
			
			visits.get_visits_for_desire(status_id, function(err, rows){

				if (err){
					return;
				}

				self.draw_visits_list(rows, map);
			});
		 },

		'show_desires_for_place': function(status_id, wof_id){

			var map_el = document.createElement("div");
			map_el.setAttribute("id", "map");

			var desire_wrapper = self.render_desire(status_id);
			
			var left_panel = document.createElement("div");
			left_panel.setAttribute("class", "col-md-6 panel panel-left");

			var right_panel = document.createElement("div");
			right_panel.setAttribute("class", "col-md-6 panel panel-right");

			left_panel.appendChild(map_el);
			right_panel.appendChild(desire_wrapper);
			
			canvas.reset();
			canvas.append(left_panel);
			canvas.append(right_panel);			

			var map = maps.new_map(map_el);

			var places = require("./mapzen.whosonfirst.bookmarks.places.js");

			places.get_place(wof_id, function(err, row){

				if (err){
					return false;
				}			

				var pl = JSON.parse(row["body"]);
				
				var place = document.createElement("span");
				place.setAttribute("class", "click-me hey-look");
				place.setAttribute("data-wof-id", wof_id);
				place.appendChild(document.createTextNode(pl["wof:name"]));

				place.onclick = function(e){
					var el = e.target;
					var wof_id = el.getAttribute("data-wof-id");
					places.show_place(wof_id);
				};
				
				var sm = document.createElement("small");
				sm.setAttribute("class", "desire-wrapper-header-location");
				sm.appendChild(place);

				var header = document.getElementById("desire-wrapper-header-" + status_id);				
				header.appendChild(sm);
			});

			var visits = require("./mapzen.whosonfirst.bookmarks.visits.js");

			visits.get_visits_for_desire_and_place(status_id, wof_id, function(err, rows){

				if (err){
					return false;
				}

				self.draw_visits_list(rows, map);
			});
		},
		
		'render_desire': function(status_id){

			var desire = self.id_to_label(status_id);
			
			var desire_wrapper = document.createElement("div");
			desire_wrapper.setAttribute("id", "desire-wrapper");
			
			var visits_wrapper = document.createElement("div");
			visits_wrapper.setAttribute("id", "visits-wrapper");

			var h2 = document.createElement("h2");
			h2.setAttribute("class", "desire-wrapper-header");			
			h2.setAttribute("id", "desire-wrapper-header-" + status_id);

			var span = document.createElement("span");
			span.setAttribute("class", "click-me");			
			span.setAttribute("data-status-id", status_id);
			span.appendChild(document.createTextNode(desire));

			span.onclick = function(e){
				var el = e.target;
				var status_id = el.getAttribute("data-status-id");
				self.show_desire(status_id);
			};
			
			h2.appendChild(span);
			
			var stats_wrapper = document.createElement("div");
			stats_wrapper.setAttribute("id", "desire-stats-wrapper-" + status_id);
			stats_wrapper.setAttribute("class", "desire-stats-wrapper");				
			
			desire_wrapper.appendChild(h2);
			desire_wrapper.appendChild(stats_wrapper);			
			desire_wrapper.appendChild(visits_wrapper);

			return desire_wrapper;
		},
		
		'draw_visits_list': function(rows, map){

			var visits = require("./mapzen.whosonfirst.bookmarks.visits.js");			
			var geojson = require("./mapzen.whosonfirst.bookmarks.geojson.js");

			var count_rows = rows.length;

			if (! count_rows){
				return true;
			}
			
			var list = visits.render_visits(rows);

			var open = true;
			var expandable = utils.render_expandable(list, { "label": "desires", "open": open });

			var wrapper = document.getElementById("visits-wrapper");
			wrapper.appendChild(expandable);

			if (map){
				var layer = geojson.add_visits_to_map(map, rows);
				layer.setZIndex(500);
			}

			namify.translate();
		},

		'render_stats': function(rows){

			var stats = document.createElement("ul");
			stats.setAttribute("class", "list-inline desire-stats");
			
			var count_rows = rows.length;

			if (! count_rows){
				var item = document.createElement("li");
				item.appendChild(document.createTextNode("Nothing yet."));
				stats.appendChild(item);
				return stats;
			}

			var status_id = rows[0]["status_id"];	// WE MAY REGRET THIS ONE DAY...
			
			var by_count = {};
			var counts = [];
			
			for (var i=0; i < count_rows; i++){

				var row = rows[i];
				
				var wof_id = row["locality_id"];	// PLEASE FIX ME...
				var count_visits = row["count_visits"];

				if (! by_count[ count_visits ]){
					by_count[ count_visits ] = [ wof_id ];					
					counts.push(count_visits);
				}

				else {
					by_count[ count_visits ].push(wof_id);
				}
			}

			counts.sort();
			counts.reverse();
			
			var counts_unq = counts.length;
			
			for (var i=0; i < counts_unq; i++){

				var count_visits = counts[i];

				var wof_ids = by_count[count_visits];
				var count_ids = wof_ids.length;

				var place_list = document.createElement("ul");
				place_list.setAttribute("class", "list-inline desire-stats-places");
				
				for (var j=0; j < count_ids; j++){

					var wof_id = wof_ids[j];
				
					var place_item = document.createElement("li");
					place_item.setAttribute("class", "desire-stats-places-item");

					var place = document.createElement("span");
					place.setAttribute("class", "namify hey-look click-me");
					place.setAttribute("data-wof-id", wof_id);
					place.setAttribute("data-status-id", status_id);					
					place.appendChild(document.createTextNode(wof_id));
					
					place.onclick = function(e){
						
						var el = e.target;
						var wof_id = el.getAttribute("data-wof-id");
						var status_id = el.getAttribute("data-status-id");						

						self.show_desires_for_place(status_id, wof_id);
						
						// var places = require("./mapzen.whosonfirst.bookmarks.places.js");
						// places.show_place(wof_id);
					};
					
					place_item.appendChild(place);
					place_list.appendChild(place_item);
				}

				var item = document.createElement("li");
				item.setAttribute("class", "desire-stats-item");
				
				item.appendChild(place_list);

				var count = document.createElement("span");
				count.setAttribute("class", "desire-stats-item-count");
				
				if (count_visits == 1){
					count.appendChild(document.createTextNode(" once"));
				}

				else if (count_visits == 2){
					count.appendChild(document.createTextNode(" twice"));
				}

				else {
					count.appendChild(document.createTextNode(" " + count_visits + " times"));
				}

				item.appendChild(count);
				stats.appendChild(item);
			}

			return stats;
		},

		'render_menu': function(selected, onclick){

			var wrapper = document.createElement("div");
			wrapper.setAttribute("class", "desire-wrapper");
			
			var status_select = document.createElement("select");
			status_select.setAttribute("id", "status");

			var all_desires = self.get_list();

			for (var id in all_desires){

				var option = document.createElement("option");
				option.setAttribute("value", id);
				option.appendChild(document.createTextNode(all_desires[id]));

				if ((selected) && (selected == id)){
					option.setAttribute("selected", "selected");
				}
				
				status_select.appendChild(option);
			}
			
			var status_button = document.createElement("button");
			status_button.setAttribute("id", "status-button");			
			status_button.setAttribute("class", "btn btn-default");
			status_button.appendChild(document.createTextNode("Save"));

			if (onclick){
				status_button.onclick = onclick;
			}

			wrapper.appendChild(status_select);
			wrapper.appendChild(status_button);

			return wrapper;
		}
	};
	
	return self;
}));
