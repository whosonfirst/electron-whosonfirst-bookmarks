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

	var api = require("./mapzen.whosonfirst.api.js");
	var place = require("./mapzen.whosonfirst.bookmarks.place.js");
	var canvas = require("./mapzen.whosonfirst.bookmarks.canvas.js");		
	
	var self = {
		
		'init': function(){

			var submit = document.getElementById("search-submit");
			
			submit.onclick = function(){

				try {
					self.search();
				}

				catch(e){
					console.log(e);
				}
				
				return false;
			}
			
		},

		'search': function(){

			var q = document.getElementById("q");
			q = q.value;

			// var by = document.getElementById("by");
			// by = by.value;

			var api_key = document.body.getAttribute("data-api-key");
			var api_endpoint = document.body.getAttribute("data-api-endpoint");

			api.set_handler('authentication', function(){
                                return api_key;
                        });
			
                        api.set_handler('endpoint', function(){
                                return api_endpoint;
                        });

			var method = "whosonfirst.places.search";
			
			var args = {
				"names": q,
				"extras": "addr:,geom:,wof:hierarchy,wof:tags",
			};

			var on_success = function(rsp){

				var places = rsp["places"];
				var count = places.length;

				var list = document.createElement("ul");
				list.setAttribute("class", "list");

				for (var i=0; i < count; i++){

					var pl = places[i];
					var name = pl["wof:name"];

					var item = document.createElement("li");
					item.setAttribute("data-place", JSON.stringify(pl));
					
					item.appendChild(document.createTextNode(name));

					if (pl["addr:full"]){

						var addr = document.createElement("small");
						addr.appendChild(document.createTextNode(pl["addr:full"]));
						
						item.appendChild(addr);
					}
					
					item.onclick = function(e){
						var el = e.target;
						var pl = el.getAttribute("data-place");

						// pl = JSON.parse(pl);

						place.draw_place(pl);
					};
					
					list.appendChild(item);
				}

				canvas.draw(list);
			};

			var on_error = function(rsp){
				console.log("SAD FACE");
				console.log(rsp);
			};

			api.execute_method(method, args, on_success, on_error);
		}
	}

	return self;
}));
