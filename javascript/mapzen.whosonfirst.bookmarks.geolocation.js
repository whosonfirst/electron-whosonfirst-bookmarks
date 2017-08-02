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

	// https://location.services.mozilla.com/api

	// sudo make these configurable
	
	const endpoint = "https://location.services.mozilla.com/v1/geolocate";
	const key = "test";

	var self = {

		'geolocate': function(on_locate, on_error){

			var onload = function(rsp){

				var target = rsp.target;

				if (target.readyState != 4){
					return;
				}

				try {
					var body = target.response;
					var data = JSON.parse(body);
				}

				catch (e) {
					console.log("[geolocate]", rsp, e);
					return on_error(e);
				}
				
				return on_locate(data);
			};

			var req = new XMLHttpRequest();
			
			req.addEventListener("load", onload);
			req.addEventListener("error", on_error);
			req.addEventListener("abort", on_error);

			var url = endpoint + "?key=" + encodeURIComponent(key);
			
			req.open("GET", url, true);
			req.send();
		}
	};

	return self;
}));
