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

	var self = {
		
		'init': function(){

			if (navigator.onLine){
				self.network_notice(true);
			}

			else {
				self.network_notice(false);
			}			
		},

		'network_notice': function(enabled){

			if (enabled){
				var el = document.getElementById("network-status");
				el.setAttribute("class", "online");
				el.setAttribute("title", "you are awake and connected to the network");
			}

			else {
				var el = document.getElementById("network-status");
				el.setAttribute("class", "offline");
				el.setAttribute("title", "unable to locate the internets");				
			}
		},		
	};

	return self;
}));
