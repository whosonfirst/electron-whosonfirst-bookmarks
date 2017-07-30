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

			var api_key = document.body.getAttribute("data-api-key");
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

				// console.log("[tangram] LOAD");
				
				var target = e.target;
				var scene = target.scene;
				
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
							return;
						}
						
						if (screenshot != "place"){					
							return;
						}

						scene.screenshot().then(function(rsp){
							console.log("[tangram][screenshot] SAVE " + wof_id);
							screenshots.save(rsp, wof_id);
						});
					}
				});
			});
			
			tangram.addTo(map);			
			return map;
		},

		// hack: see notes in mapzen.whosonfirst.bookmarks.geojson.js
		
		'get_scene': function(){
			return wtf;
		}
	}

	return self;
}));
