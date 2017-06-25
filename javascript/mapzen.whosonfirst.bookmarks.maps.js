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
	
	var self = {
		
		'new_map': function(el){

			var tangram;
			var scene;
			
			var tangram_subs = {};
			
			var id = el.getAttribute("id");

			if (! id){
				console.log("map element missing an 'id' attribute");
				return false;
			}
			
			var screenshot = el.getAttribute("data-screenshot");
			var wof_id = el.getAttribute("data-wof-id");
			
			var do_screenshot = false;
			
			if (screenshot == "place"){
				
				wof_id = parseInt(wof_id);
				
				if (wof_id > 0){
					do_screenshot = true;
				}
			}

			// https://mapzen.com/documentation/tangram/Javascript-API/#screenshot
			
			if (do_screenshot){
				
				var on_view = function(){
					scene.screenshot().then(function(rsp){
						screenshots.save(rsp, wof_id);
					});
				};

				// some day we will have multiple "view complete" actions
				// but today we do not... (20170624/thisisaaronland)
				
				tangram_subs[ "view_complete" ] = on_view;
			}

			var api_key = document.body.getAttribute("data-api-key");			
			L.Mapzen.apiKey = api_key;

			var map = L.Mapzen.map(id, {
    				tangramOptions: {
    					scene: L.Mapzen.BasemapStyles.Refill
    				}
			});
			
			map.on("tangramloaded", function(e){

				// https://mapzen.com/documentation/tangram/Javascript-API/#events
					
				tangram = e.tangramLayer;
				scene = tangram.scene;
				
				scene.subscribe(tangram_subs);
			});
			
			return map;
		}		
	}

	return self;
}));
