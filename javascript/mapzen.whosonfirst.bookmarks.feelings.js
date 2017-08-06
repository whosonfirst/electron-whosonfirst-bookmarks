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
	
	const feelings = {
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
			return feelings;
		},
		
		'id_to_label': function(id){
			return feelings[id];
		},

		'show_feelings_all': function(){

			var left_panel = document.createElement("div");
			left_panel.setAttribute("class", "col-md-12 panel");

			var list = document.createElement("ul");
			list.setAttribute("class", "list feelings-list");
			
			for (var feelings_id in feelings){

				var label = feelings[feelings_id];
				
				var item = document.createElement("li");
				list.setAttribute("class", "feelings-list-item");
				list.setAttribute("id", "feelings-list-item-" + feelings_id);
				
				var header = document.createElement("h4");
				header.setAttribute("id", "feelings-list-item-header-" + feelings_id);
				
				header.setAttribute("class", "feeling feelings-list-item-header click-me");
				header.setAttribute("data-feelings-id", feelings_id);
				header.appendChild(document.createTextNode(label));

				header.onclick = function(e){

					var el = e.target;
					var feelings_id = el.getAttribute("data-feelings-id");

					self.show_feelings(feelings_id);
				};

				var stats_wrapper = document.createElement("div");
				stats_wrapper.setAttribute("id", "feelings-stats-wrapper-" + feelings_id);
				stats_wrapper.setAttribute("class", "feelings-stats-wrapper");				
				
				item.appendChild(header);
				item.appendChild(stats_wrapper);
				
				list.appendChild(item);
			}

			left_panel.appendChild(list);
			
			canvas.draw(left_panel);

			for (var feelings_id in feelings){
				self.show_localities_for_feelings(feelings_id);
			}
		},

		'show_localities_for_feelings': function(feelings_id){

			var visits = require("./mapzen.whosonfirst.bookmarks.visits.js");

			visits.get_localities_for_feelings(feelings_id, function(err, rows){

				var stats = self.render_stats(rows);
				
				var stats_wrapper = document.getElementById("feelings-stats-wrapper-" + feelings_id);
				stats_wrapper.appendChild(stats);
				
				namify.translate();	// PLEASE RUN ONCE WITH A WAITGROUP
			});			
		},

		'show_feelings': function(feelings_id){
			
			var map_el = document.createElement("div");
			map_el.setAttribute("id", "map");

			var feelings_wrapper = self.render_feelings(feelings_id);
			
			var left_panel = document.createElement("div");
			left_panel.setAttribute("class", "col-md-6 panel panel-left");

			var right_panel = document.createElement("div");
			right_panel.setAttribute("class", "col-md-6 panel panel-right");

			left_panel.appendChild(map_el);
			
			right_panel.appendChild(feelings_wrapper);
			
			canvas.reset();
			canvas.append(left_panel);
			canvas.append(right_panel);			

			var map = maps.new_map(map_el);

			self.show_localities_for_feelings(feelings_id);

			var visits = require("./mapzen.whosonfirst.bookmarks.visits.js");
			
			visits.get_visits_for_feelings(feelings_id, function(err, rows){

				if (err){
					return;
				}

				self.draw_visits_list(rows, map);
			});
		 },

		'show_feelings_for_place': function(feelings_id, wof_id){

			var map_el = document.createElement("div");
			map_el.setAttribute("id", "map");

			var feelings_wrapper = self.render_feelings(feelings_id);
			
			var left_panel = document.createElement("div");
			left_panel.setAttribute("class", "col-md-6 panel panel-left");

			var right_panel = document.createElement("div");
			right_panel.setAttribute("class", "col-md-6 panel panel-right");

			left_panel.appendChild(map_el);
			right_panel.appendChild(feelings_wrapper);
			
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
				sm.setAttribute("class", "feelings-wrapper-header-location");
				sm.appendChild(place);

				var header = document.getElementById("feelings-wrapper-header-" + feelings_id);				
				header.appendChild(sm);
			});

			var visits = require("./mapzen.whosonfirst.bookmarks.visits.js");

			visits.get_visits_for_feelings_and_place(feelings_id, wof_id, function(err, rows){

				if (err){
					return false;
				}

				self.draw_visits_list(rows, map);
			});
		},
		
		'render_feelings': function(feelings_id){

			var feelings = self.id_to_label(feelings_id);
			
			var feelings_wrapper = document.createElement("div");
			feelings_wrapper.setAttribute("id", "feelings-wrapper");
			
			var visits_wrapper = document.createElement("div");
			visits_wrapper.setAttribute("id", "visits-wrapper");

			var h2 = document.createElement("h2");
			h2.setAttribute("class", "feelings-wrapper-header");			
			h2.setAttribute("id", "feelings-wrapper-header-" + feelings_id);

			var span = document.createElement("span");
			span.setAttribute("class", "click-me");			
			span.setAttribute("data-feelings-id", feelings_id);
			span.appendChild(document.createTextNode(feelings));

			span.onclick = function(e){
				var el = e.target;
				var feelings_id = el.getAttribute("data-feelings-id");
				self.show_feelings(feelings_id);
			};
			
			h2.appendChild(span);
			
			var stats_wrapper = document.createElement("div");
			stats_wrapper.setAttribute("id", "feelings-stats-wrapper-" + feelings_id);
			stats_wrapper.setAttribute("class", "feelings-stats-wrapper");				
			
			feelings_wrapper.appendChild(h2);
			feelings_wrapper.appendChild(stats_wrapper);			
			feelings_wrapper.appendChild(visits_wrapper);

			return feelings_wrapper;
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
			var expandable = utils.render_expandable(list, { "label": "feelings", "open": open });

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
			stats.setAttribute("class", "list-inline feelings-stats");
			
			var count_rows = rows.length;

			if (! count_rows){
				var item = document.createElement("li");
				item.appendChild(document.createTextNode("Nothing yet."));
				stats.appendChild(item);
				return stats;
			}

			var feelings_id = rows[0]["feelings_id"];	// WE MAY REGRET THIS ONE DAY...
			
			var by_count = {};
			var counts = [];
			
			for (var i=0; i < count_rows; i++){

				var row = rows[i];
				
				var wof_id = row["locality_id"];	// PLEASE FIX ME...
				var count_visits = parseInt(row["count_visits"]);

				if (! by_count[ count_visits ]){
					by_count[ count_visits ] = [ wof_id ];					
					counts.push(count_visits);
				}

				else {
					by_count[ count_visits ].push(wof_id);
				}
			}

			// counts.sort();
			// counts.reverse();
			
			var counts_unq = counts.length;
			
			for (var i=0; i < counts_unq; i++){

				var count_visits = counts[i];

				var wof_ids = by_count[count_visits];
				var count_ids = wof_ids.length;

				var place_list = document.createElement("ul");
				place_list.setAttribute("class", "list-inline feelings-stats-places");
				
				for (var j=0; j < count_ids; j++){

					var wof_id = wof_ids[j];
				
					var place_item = document.createElement("li");
					place_item.setAttribute("class", "feelings-stats-places-item");

					var place = document.createElement("span");
					place.setAttribute("class", "namify hey-look click-me");
					place.setAttribute("data-wof-id", wof_id);
					place.setAttribute("data-feelings-id", feelings_id);					
					place.appendChild(document.createTextNode(wof_id));
					
					place.onclick = function(e){
						
						var el = e.target;
						var wof_id = el.getAttribute("data-wof-id");
						var feelings_id = el.getAttribute("data-feelings-id");						

						self.show_feelings_for_place(feelings_id, wof_id);
						
						// var places = require("./mapzen.whosonfirst.bookmarks.places.js");
						// places.show_place(wof_id);
					};
					
					place_item.appendChild(place);
					place_list.appendChild(place_item);
				}

				var item = document.createElement("li");
				item.setAttribute("class", "feelings-stats-item");
				
				item.appendChild(place_list);

				var count = document.createElement("span");
				count.setAttribute("class", "feelings-stats-item-count");
				
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
			wrapper.setAttribute("class", "feelings-wrapper");
			
			var status_select = document.createElement("select");
			status_select.setAttribute("id", "feelings");

			var all_feelings = self.get_list();

			for (var id in all_feelings){

				var option = document.createElement("option");
				option.setAttribute("value", id);
				option.appendChild(document.createTextNode(all_feelings[id]));

				if ((selected) && (selected == id)){
					option.setAttribute("selected", "selected");
				}
				
				status_select.appendChild(option);
			}
			
			var status_button = document.createElement("button");
			status_button.setAttribute("id", "feelings-button");			
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
