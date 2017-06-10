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

	// var api = require("./mapzen.whosonfirst.api.js");

	var canvas = require("./mapzen.whosonfirst.bookmarks.canvas.js");
	
	var self = {
		
		'init': function(){

		},

		'draw_place': function(pl){

			pl = JSON.parse(pl);
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
			map.setAttribute("data-geom-latitude", pl["geom:latitude"]);
			map.setAttribute("data-geom-longitude", pl["geom:longitude"]);
			map.setAttribute("data-wofid", pl["wof:id"]);

			var button = document.createElement("button");
			button.setAttribute("class", "btn btn-primary");
			button.appendChild(document.createTextNode("Save"));
			
			var wrapper = document.createElement("div");
			wrapper.appendChild(h2);
			wrapper.appendChild(map);
			wrapper.appendChild(button);
			
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
		}
	}

	return self;
}));
