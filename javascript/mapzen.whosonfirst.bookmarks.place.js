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

	var canvas = require("./mapzen.whosonfirst.bookmarks.canvas.js");
	var db = require("./mapzen.whosonfirst.bookmarks.database.js");	

	var desires = require("./mapzen.whosonfirst.bookmarks.desires.js");
	
	var self = {
		
		'init': function(){

		},

		'draw_place': function(str_pl){

			var pl = JSON.parse(str_pl);
			console.log(pl);

			var h2 = document.createElement("h2");
			h2.appendChild(document.createTextNode(pl["wof:name"]));

			if (pl["addr:full"]){
				
				var addr = document.createElement("small");
				addr.appendChild(document.createTextNode(pl["addr:full"]));

				h2.appendChild(addr);
			}
			
			var map = document.createElement("div");
			map.setAttribute("id", "map");
			map.setAttribute("data-place", str_pl);
			
			var select = document.createElement("select");
			select.setAttribute("id", "status");

			var all_desires = desires.get_list();

			for (var id in all_desires){

				var option = document.createElement("option");
				option.setAttribute("value", id);
				option.appendChild(document.createTextNode(all_desires[id]));
				
				select.appendChild(option);
			}
			
			var button = document.createElement("button");
			button.setAttribute("class", "btn btn-primary");
			button.appendChild(document.createTextNode("Save"));

			button.onclick = self.add_place;
			
			var controls = document.createElement("div");
			controls.setAttribute("id", "controls");
			controls.appendChild(select);
			controls.appendChild(button);

			var visits = document.createElement("div");
			visits.setAttribute("id", "visits");
			
			var wrapper = document.createElement("div");
			wrapper.appendChild(h2);
			wrapper.appendChild(map);
			wrapper.appendChild(controls);
			wrapper.appendChild(visits);
			
			canvas.draw(wrapper);

			var api_key = document.body.getAttribute("data-api-key");			
			L.Mapzen.apiKey = api_key;

			var map = L.Mapzen.map('map', {
    				tangramOptions: {
    					scene: L.Mapzen.BasemapStyles.Refill
    				}
			});

			var lat = pl["geom:latitude"];
			var lon = pl["geom:longitude"];			
			
			map.setView([lat, lon], 16);

			L.marker([lat, lon]).addTo(map);

			self.draw_visits_list(pl);
		},

		'draw_visits_list': function(pl){

			db.get_visits_for_place(pl['wof:id'], function(err, rows){

				if (err){
					console.log(err);
					return;
				}

				var count = rows.length;
				var list = document.createElement("ul");

				for (var i=0; i < count; i++){

					var row = rows[i];
					var status_id = row['status_id'];
					var desire = desires.id_to_label(status_id);
					
					var q = document.createElement("q");
					q.appendChild(document.createTextNode(desire));
					
					var v = document.createElement("li");
					v.appendChild(document.createTextNode("You said "));
					v.appendChild(q);
					v.appendChild(document.createTextNode(" on or around "));
					v.appendChild(document.createTextNode(row['date']));

					var remove = document.createElement("button");
					remove.setAttribute("class", "btn btn-sm");
					remove.setAttribute("data-visit-id", row['id']);
					
					remove.appendChild(document.createTextNode("x"));

					remove.onclick = function(e){

						var el = e.target;
						var id = el.getAttribute("data-visit-id");

						if (! confirm("Are you sure you want to delete this visit?")){
							return false;
						}

						db.remove_visit(id, function(){
							self.draw_visits_list(pl);
						});

						return false;
					};
					
					v.appendChild(remove);
					
					list.appendChild(v);
				}

				var visits = document.getElementById("visits");
				visits.innerHTML = "";
				
				visits.appendChild(list);
			});

		},
		
		'add_place': function(e){

			var map = document.getElementById("map");

			var str_pl = map.getAttribute("data-place");
			var pl = JSON.parse(str_pl);			
						
			var status = document.getElementById("status");
			status = status.value;
			
			db.add_visit(pl, status, function(err){

				if (err){
					console.log(err);
					return false;
				}

				var visit_id = this.lastID;
				self.draw_visits_list(pl);
			});
			
			return false;
		}
		
	}

	return self;
}));
