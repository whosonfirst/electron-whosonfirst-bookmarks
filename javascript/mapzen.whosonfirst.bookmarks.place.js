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
			
			var wrapper = document.createElement("div");
			wrapper.appendChild(h2);
			wrapper.appendChild(map);
			wrapper.appendChild(controls);
			
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
		},

		'add_place': function(e){

			var map = document.getElementById("map");

			var str_pl = map.getAttribute("data-place");
			var pl = JSON.parse(str_pl);			
						
			var status = document.getElementById("status");
			status = status.value;
			
			db.add_place(pl, status);
			return false;
		}
		
	}

	return self;
}));
