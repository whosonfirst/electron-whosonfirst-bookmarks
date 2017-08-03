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
	
	const screenshots = require("./mapzen.whosonfirst.bookmarks.screenshots.js");

	var sub = false;
	var wtf;	// hack: see notes in mapzen.whosonfirst.bookmarks.geojson.js
	
	var self = {

		'new_map': function(el){

			var map_id = el.getAttribute("id");

			if (! map_id){
				console.log("[map] ERR map element missing an 'id' attribute");
				return false;
			}

			var configure_scene = function(scene){

				// console.log("[tangram][scene] SETUP");
				
				wtf = scene;	// hack: see notes in mapzen.whosonfirst.bookmarks.geojson.js
				
				scene.subscribe({
					"view_complete": function(){
						
						// console.log("[tangram][scene] VIEW COMPLETE");
						
						// NOT HAPPY ABOUT THIS BUT IT SEEMS TO BE
						// THE ONLY WAY TO MAKE IT WORK...
						
						var map_el = document.getElementById(map_id);
						
						var screenshot = map_el.getAttribute("data-screenshot");
						var wof_id = map_el.getAttribute("data-wof-id");
						wof_id = parseInt(wof_id);				
						
						if (wof_id < 0){
							// console.log("[tangram][screenshot] SKIP missing WOF IF");
							return;
						}
						
						if (screenshot != "place"){
							// console.log("[tangram][screenshot] SKIP not a 'place'");
							return;
						}

						// https://mapzen.com/documentation/tangram/Javascript-API/#screenshot
						
						scene.screenshot().then(function(rsp){
							console.log("[tangram][screenshot] SAVE " + wof_id);
							screenshots.save(rsp, wof_id);
						});
					}
				});
			};
			
			var api_key = document.body.getAttribute("data-api-key");

			L.Mapzen.apiKey = api_key;

			var map = L.Mapzen.map(map_id, {

				// https://github.com/mapzen/mapzen.js/blob/master/src/js/components/tangram.js
				
    				tangramOptions: {
					// scene: L.Mapzen.BasemapStyles.Refill,
					scene: "tangram/refill-style.zip",
					tangramURL: "javascript/tangram.min.js"
    				}
			});
			
			map.on("tangramloaded", function(e){
				// https://mapzen.com/documentation/tangram/Javascript-API/#events
				var tangram = e.tangramLayer;
				var scene = tangram.scene;
				configure_scene(scene);
			});

			map.on("move", function(){

				var el = document.getElementById("map-feedback");

				if (! el){
					return;
				}

				var centroid = map.getCenter();
				var zoom = map.getZoom();
				var bounds = map.getBounds();

				var lat = centroid["lat"].toFixed(6);
				var lon = centroid["lng"].toFixed(6);				
				zoom = parseInt(zoom);

				var latlon = [ lat, lon ];
				latlon = latlon.join(", ");
				
				var list = document.createElement("ul");
				list.setAttribute("class", "list-inline map-feedback-list");

				var lat_el = document.createElement("li");
				lat_el.setAttribute("class", "map-feedback-latitude");
				lat_el.appendChild(document.createTextNode(lat));
				list.appendChild(lat_el);
				
				var lon_el = document.createElement("li");
				lon_el.setAttribute("class", "map-feedback-longitude");
				lon_el.appendChild(document.createTextNode(lon));
				list.appendChild(lon_el);

				var zoom_el = document.createElement("li");
				zoom_el.setAttribute("class", "map-feedback-zoom");
				zoom_el.appendChild(document.createTextNode(zoom));
				list.appendChild(zoom_el);

				var sw = bounds.getSouthWest();
				var ne = bounds.getNorthEast();

				var min_lat = sw["lat"].toFixed(6);
				var min_lon = sw["lng"].toFixed(6);
				var max_lat = ne["lat"].toFixed(6);
				var max_lon = ne["lng"].toFixed(6);				

				var bbox = [ min_lat, min_lon, max_lat, max_lon ];
				bbox = bbox.join(", ");

				var bbox_el = document.createElement("li");
				bbox_el.setAttribute("class", "map-feedback-bbox");
				bbox_el.appendChild(document.createTextNode(bbox));
				// list.appendChild(bbox_el);
				
				el.innerHTML = "";
				el.appendChild(list);
				
				// console.log("MOVE END", centroid, zoom, bounds);
			});
			
			/*
			var map = L.map(map_id);

			var tangram = Tangram.leafletLayer({
				scene: {
					import: "tangram/refill-style.zip",
					global: {
						sdk_mapzen_api_key: api_key
					}
				},
				numWorkers: 2,
        			unloadInvisibleTiles: false,
				updateWhenIdle: true,
				attribution: "",
			});

			tangram.on("load", function(e){
				var target = e.target;
				var scene = target.scene;
				configure_scene(scene);
			});
			
			tangram.addTo(map);
			*/
			
			return map;
		},
		
		// hack: see notes in mapzen.whosonfirst.bookmarks.geojson.js
		
		'get_scene': function(){
			return wtf;
		}
	}

	return self;
}));
