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

			var el = document.createTextNode(pl);
			canvas.draw(el);
		}
	}

	return self;
}));
