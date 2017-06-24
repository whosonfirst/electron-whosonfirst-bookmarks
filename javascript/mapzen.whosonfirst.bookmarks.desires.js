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
	
	const desires = {
		0: "i've been there",
		1: "i was there",
		2: "i want to go there",
		3: "again again",
		4: "again",
		5: "again maybe",
		6: "again never",
		7: "meh"
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
			left_panel.setAttribute("class", "col-md-6 panel");

			var right_panel = document.createElement("div");
			right_panel.setAttribute("class", "col-md-6 panel");

			var list = document.createElement("li");

			for (var status_id in desires){

				var label = desires[status_id];

				var item = document.createElement("li");
				var span = document.createElement("span");
				
				span.setAttribute("class", "desire click-me");
				span.setAttribute("data-status-id", status_id);
				span.appendChild(document.createTextNode(label));

				span.onclick = function(e){

					var el = e.target;
					var status_id = el.getAttribute("data-status-id");

					self.show_desire(status_id);
				};
				
				item.appendChild(span);
				list.appendChild(item);
			}

			left_panel.appendChild(list);
			
			canvas.reset();
			canvas.append(left_panel);
			canvas.append(right_panel);			
		},
		
		'show_desire': function(status_id){
			
			var map = document.createElement("div");
			map.setAttribute("id", "map");

			var desire_wrapper = self.render_desire(status_id);
			
			var left_panel = document.createElement("div");
			left_panel.setAttribute("class", "col-md-6 panel");

			var right_panel = document.createElement("div");
			right_panel.setAttribute("class", "col-md-6 panel");

			left_panel.appendChild(map);
			
			right_panel.appendChild(desire_wrapper);
			
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

			self.draw_visits_list(status_id, map);			
		},

		'render_desire': function(status_id){

			var desire = self.id_to_label(status_id);
			
			var desire_wrapper = document.createElement("div");
			desire_wrapper.setAttribute("id", "desire-wrapper");
			
			var visits_wrapper = document.createElement("div");
			visits_wrapper.setAttribute("id", "visits-wrapper");

			var h2 = document.createElement("h2");
			h2.appendChild(document.createTextNode(desire));

			desire_wrapper.appendChild(h2);
			desire_wrapper.appendChild(visits_wrapper);

			return desire_wrapper;
		},
		
		'draw_visits_list': function(status_id, map){

			var geojson = require("./mapzen.whosonfirst.bookmarks.geojson.js");			
			var visits = require("./mapzen.whosonfirst.bookmarks.visits.js");
			
			visits.get_visits_for_desire(status_id, function(err, rows){

				if (err){
					return false;
				}

				var list = visits.render_visits(rows);

				var wrapper = document.getElementById("visits-wrapper");
				wrapper.appendChild(list);

				if (map){
					geojson.add_visits_to_map(map, rows);
				}
			});
		},
	};
	
	return self;
}));
