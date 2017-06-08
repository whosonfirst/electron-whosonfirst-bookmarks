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

		/*
		g.mapzen = g.mapzen || {};
		g.mapzen.whosonfirst = g.mapzen.whosonfirst || {};
		g.mapzen.whosonfirst.bookmarks = g.mapzen.whosonfirst.bookmarks = {};
		g.mapzen.whosonfirst.bookmarks.place = g.mapzen.whosonfirst.bookmarks.place = f();		
		*/
		
        }

}(function(){

	// var api = require("./javascript/mapzen.whosonfirst.api.js");
	
	var self = {
		
		'init': function(){

		},

		'draw_place': function(pl){

			var results = document.getElementById("results");
			results.innerHTML = "";

			results.appendChild(document.createTextNode(pl));
		}
	}

	return self;
}));
