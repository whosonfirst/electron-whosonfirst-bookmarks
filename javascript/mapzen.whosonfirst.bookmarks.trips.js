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

	const db = require("./mapzen.whosonfirst.bookmarks.database.js");
	const conn = db.conn();

	const canvas = require("./mapzen.whosonfirst.bookmarks.canvas.js");

	// https://www.npmjs.com/package/js-datepicker

	var self = {

		'draw_trips': function(){


		},

		'show_add_trip': function(){

			var left_panel = document.createElement("div");
			left_panel.setAttribute("class", "col-md-6 panel panel-left");

			var right_panel = document.createElement("div");
			right_panel.setAttribute("class", "col-md-6 panel panel-right");

			var map_el = document.createElement("div");
			map_el.setAttribute("id", "map");

			var trip_form = document.createElement("form");

			var dest = document.createElement("input");
			dest.setAttribute("type", "text");

			var start = document.createElement("div");
			start.setAttribute("id", "start");

			var end = document.createElement("div");
			end.setAttribute("id", "end");
			
			trip_form.appendChild(dest);
			trip_form.appendChild(start);
			trip_form.appendChild(end);			
			
			left_panel.appendChild(map_el);
			right_panel.appendChild(trip_form);

			canvas.reset();			
			canvas.append(left_panel);
			canvas.append(right_panel);			

			var start_picker = require("js-datepicker/datepicker.js");
			start_picker(start, {});

			var end_picker = require("js-datepicker/datepicker.js");
			end_picker(end, {});
			
		}
	};

	return self;
}));
