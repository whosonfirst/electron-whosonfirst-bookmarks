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

	const electron = require('electron');
	const path = require('path');

	const fs = require('fs');
	const fsex = require('fs-extra');	

	const app = electron.app || electron.remote.app;
	const udata = app.getPath("userData");
	
	var self = {
		
		'new_map': function(el){

			var tangram;
			var scene;
			
			var tangram_subs = {};
			
			var id = el.getAttribute("id");
			
			var screenshot = el.getAttribute("data-screenshot");
			var do_screenshot = false;

			var screenshot_id;
			var screenshot_root;
			
			if (screenshot){

				var id2root = function(id){

					str_id = new String(id);
					tmp = new Array();

					while (str_id.length){
						var part = str_id.substr(0, 3);
						tmp.push(part);
						str_id = str_id.substr(3);
					}
					
					parent = tmp.join("/");
					return parent;
				};
				
				if (screenshot == "place"){

					var wof_id = el.getAttribute("data-wof-id");
					wof_id = parseInt(wof_id);
					
					if (wof_id > 0){

						screenshot_id = wof_id;

						screenshot_root = id2root(screenshot_id);
						screenshot_root = path.join("places", screenshot_root);
						
						do_screenshot = true;
					}
				}
				
				else {}
			}

			// https://mapzen.com/documentation/tangram/Javascript-API/#screenshot
			
			if (do_screenshot){
				
				var parent = screenshot;
				var fname;

				var save_screenshot = function(rsp){

					var fname = screenshot_id + "." + rsp.type;
					var froot = udata;
					
					if (screenshot_root){
						froot = path.join(udata, screenshot_root);
					}
					
					if (! fs.existsSync(froot)){
						fsex.ensureDirSync(froot);
					}
					
					var fpath = path.join(froot, fname);
					// console.log("SAVE " + fpath);
					
					var fileReader = new FileReader();
					
					fileReader.onload = function (){
						fs.writeFileSync(fpath, Buffer(new Uint8Array(this.result)));
					};
					
					fileReader.readAsArrayBuffer(rsp.blob);
				};
				
				var on_view = function(){
					scene.screenshot().then(save_screenshot);
				};

				tangram_subs[ "view_complete" ] = on_view;
			}

			// Okay, go...
			
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
