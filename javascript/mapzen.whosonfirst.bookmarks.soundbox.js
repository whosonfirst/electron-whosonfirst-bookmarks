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
	
	var self = {

		'render_menu': function(wofid, property, options, onclick){

			var wrapper = document.createElement("div");
			wrapper.setAttribute("class", "soundbox-wrapper");
			
			var select_el = document.createElement("select");
			select_el.setAttribute("id", "soundbox-report-select");
			select_el.setAttribute("class", "soundbox-select-menu");
			select_el.setAttribute("data-wof-id", wofid);
			select_el.setAttribute("data-soundbox-property", property);
			
			for (var o in options){
				
				var label = options[o];
				
				var option = document.createElement("option");
				option.setAttribute("class", "soundbox-select-option");
				option.setAttribute("value", o);
				option.appendChild(document.createTextNode(label));
				select_el.appendChild(option);
			}

			var report_button = document.createElement("button");
			report_button.setAttribute("id", "soundbox-report-button");
			report_button.setAttribute("class", "btn btn-default");
			report_button.appendChild(document.createTextNode("Report"));

			if (onclick){
				report_button.onclick = onclick;
			}

			wrapper.appendChild(select_el);
			wrapper.appendChild(report_button);

			return wrapper;
		},
	};

	return self;

}));
