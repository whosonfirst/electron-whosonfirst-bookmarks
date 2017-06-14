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

	const visits = require("./mapzen.whosonfirst.bookmarks.visits.js");
	
	var self = {
		
		'init': function(){

			var show_v = document.getElementById("show-visits");
			show_v.onclick = function(){ visits.show_visits(); };
			
		}
	};

	return self;
}));
