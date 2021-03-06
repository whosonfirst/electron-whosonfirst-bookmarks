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

	// var api = require("./javascript/mapzen.whosonfirst.api.js");
	
	var self = {
		
		'draw': function(el){

			self.reset();
			self.append(el);
		},

		'append': function(el){
			var canvas = document.getElementById("canvas");
			canvas.appendChild(el);
		},
		
		'reset': function(){
			var canvas = document.getElementById("canvas");
			canvas.innerHTML = "";
		}
	}

	return self;
}));
