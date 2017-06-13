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

	var d = require("./mapzen.whosonfirst.bookmarks.desires.js");
	
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

			var desires = {
				0: "i've been there",
				1: "i was there",
				2: "i want to go there",
				3: "again again",
				4: "again",
				5: "again maybe",
				6: "again never",
				7: "meh"
			};

			for (var id in desires){

				var option = document.createElement("option");
				option.setAttribute("value", id);
				option.appendChild(document.createTextNode(desires[id]));

				console.log(option);
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

			self.draw_visits(pl);
		},

		'draw_visits': function(pl){

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
					var desire = d.id_to_label(status_id);
					
					var q = document.createElement("q");
					q.appendChild(document.createTextNode(desire));
					
					var v = document.createElement("li");
					v.appendChild(document.createTextNode("You said "));
					v.appendChild(q);
					v.appendChild(document.createTextNode(" on or around "));
					v.appendChild(document.createTextNode(row['date']));

					list.appendChild(v);
				}

				var visits = document.getElementById("visits");
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

				self.draw_visits(pl);
			});
			
			return false;
		}
		
	}

	return self;
}));
