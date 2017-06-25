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
	
	var self = {

		'new_map': function(el){

			var map_id = el.getAttribute("id");

			if (! map_id){
				console.log("map element missing an 'id' attribute");
				return false;
			}
			
			var api_key = document.body.getAttribute("data-api-key");			
			L.Mapzen.apiKey = api_key;

			var map = L.Mapzen.map(map_id, {
    				tangramOptions: {
    					scene: L.Mapzen.BasemapStyles.Refill
    				}
			});
			
			map.on("tangramloaded", function(e){

				// https://mapzen.com/documentation/tangram/Javascript-API/#events
				// https://mapzen.com/documentation/tangram/Javascript-API/#screenshot
				
				var tangram = e.tangramLayer;
				var scene = tangram.scene;

				scene.subscribe({
					"view_complete": function(){

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

						// console.log("SCREENSHOTING " + wof_id);
						
						scene.screenshot().then(function(rsp){
							screenshots.save(rsp, wof_id);
						});
					}
				});
			});

			return map;
		}		
	}

	return self;
}));
