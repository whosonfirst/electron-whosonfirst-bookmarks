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

	const pt = require("./mapzen.whosonfirst.bookmarks.placetypes.js");
	const visits = require("./mapzen.whosonfirst.bookmarks.visits.js");
	const feelings = require("./mapzen.whosonfirst.bookmarks.feelings.js");
	const lists = require("./mapzen.whosonfirst.bookmarks.lists.js");	
	const trips = require("./mapzen.whosonfirst.bookmarks.trips.js");
	const browse = require("./mapzen.whosonfirst.bookmarks.browse.js");	
	
	var self = {
		
		'init': function(){

			var show_c = document.getElementById("show-cities");
			show_c.onclick = function(){ pt.show_placetype("locality"); };

			var show_n = document.getElementById("show-neighbourhoods");
			show_n.onclick = function(){ pt.show_placetype("neighbourhood"); };
			
			var show_v = document.getElementById("show-visits");
			show_v.onclick = function(){ visits.show_visits(); };

			var show_l = document.getElementById("show-lists");
			show_l.onclick = function(){ lists.show_lists(); };
			
			var show_f = document.getElementById("show-feelings");
			show_f.onclick = function(){ feelings.show_feelings(); };

			var show_t = document.getElementById("show-trips");
			show_t.onclick = function(){ trips.show_trips(); };

			var show_nb = document.getElementById("show-browse");
			show_nb.onclick = function(){ browse.show_browse(); };
			
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
