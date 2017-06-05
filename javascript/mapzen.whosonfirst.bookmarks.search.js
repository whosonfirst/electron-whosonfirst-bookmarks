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

		g.mapzen = g.mapzen || {};
		g.mapzen.whosonfirst = g.mapzen.whosonfirst || {};
		g.mapzen.whosonfirst.bookmarks = g.mapzen.whosonfirst.bookmarks = {};
		g.mapzen.whosonfirst.bookmarks.search = g.mapzen.whosonfirst.bookmarks.search = f();		
		
        }

}(function(){

	var api = require("./javascript/mapzen.whosonfirst.api.js");
	
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

			var by = document.getElementById("by");
			by = by.value;

			var api_key = document.body.getAttribute("data-api-key");
			var api_endpoint = document.body.getAttribute("data-api-endpoint");

			api.set_handler('authentication', function(){
                                return api_key;
                        });
			
                        api.set_handler('endpoint', function(){
                                return api_endpoint;
                        });

			var method = "whosonfirst.places.search";
			var args = { "names": q };

			var on_success = function(rsp){
				console.log(rsp);
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
