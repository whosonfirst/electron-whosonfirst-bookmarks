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

	var canvas = require("./mapzen.whosonfirst.bookmarks.canvas.js");

	var log = [];
	
	var self = {
		
		'init': function(){
			
		},

		'info': function(msg){
			self.message(msg, "info");
		},

		'warning': function(msg){
			self.message(msg, "warning");
		},
		
		'error': function(msg){
			self.message(msg, "error");
		},

		'debug': function(msg){
			self.message(msg, "debug");
		},
		
		'message': function(msg, msg_class){

			var dt = new Date();
			var ev = [dt, msg_class, msg];

			log.push(ev);
			
			var str_ev = ev.join(" ");
			console.log(str_ev);
			
			if (msg_class == "debug"){
				return;
			}
			
			var feedback = document.getElementById("feedback");

			if (! feedback){
				return
			}

			if (! msg_class){
				msg_class = "message";
			}
			
			var el = document.createElement("div");
			el.setAttribute("class", "feedback feedback-" + msg_class);

			el.appendChild(document.createTextNode(msg));
			
			feedback.innerHTML = "";
			feedback.appendChild(el);
		},
				
	}

	return self;
}));
