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

	const utils = require("./mapzen.whosonfirst.utils.js");
	
	const desires = require("./mapzen.whosonfirst.bookmarks.desires.js");
	const soundbox = require("./mapzen.whosonfirst.bookmarks.soundbox.js");	
	
	var self = {

		'extras': function(){
			return "addr:,edtf:,geom:,lbl:,mz:,wof:hierarchy,wof:superseded_by,wof:tags";
		},

		'extras_list': function(){
			var extras = self.extras();
			return extras.split(",");
		},
		
		'render_spr': function(row){

			var wrapper_el = document.createElement("div")
			wrapper_el.setAttribute("class", "spr-wrapper");
			
			var header_el = self.render_spr_header(row);
			var dates_el = self.render_spr_dates(row);
			var details_el = self.render_spr_details(row);
			var visits_el = self.render_spr_visits(row);
			var edit_el = self.render_spr_edit(row);
			var status_el = self.render_spr_status(row);
			
			var edit_exp = utils.render_expandable(edit_el, {"label": "edit"});
			
			wrapper_el.appendChild(header_el);
			wrapper_el.appendChild(dates_el);			
			wrapper_el.appendChild(details_el);
			wrapper_el.appendChild(edit_exp);
			wrapper_el.appendChild(status_el);
			
			var visits_trigger = self.render_spr_visits_trigger();

			// PLEASE MAKE ME WORK... SOMEHOW...
			// (20170803/thisisaaronland)
			
			wrapper_el.onload = function(){
				console.log("spr wrapper onload for " + row["wof:id"]);
				visits_trigger(row);
			};
		
			return wrapper_el;
		},

		'render_spr_header': function(row){

			var header_el = document.createElement("div");
			header_el.setAttribute("class", "spr-header");
				
			var name_el = document.createElement("span");
			name_el.setAttribute("data-wof-id", row["wof:id"]);
			name_el.setAttribute("class", "hey-look click-me spr-name");
			name_el.appendChild(document.createTextNode(row["wof:name"]));
			
			name_el.onclick = function(e){
				
				var el = e.target;
				var wofid = el.getAttribute("data-wof-id");
				
				var places = require("./mapzen.whosonfirst.bookmarks.places.js");
				places.show_place(wofid);
				return false;
			};
			
			var wofid_el = document.createElement("code");
			wofid_el.setAttribute("data-wof-id", row["wof:id"]);			
			wofid_el.setAttribute("class", "spr-wofid");				
			wofid_el.appendChild(document.createTextNode(row["wof:id"]));

			wofid_el.onclick = function(e){

				var el = e.target;
				var wofid = el.getAttribute("data-wof-id");

				var raw = document.getElementById("spr-raw-" + wofid);
				
				if (! raw){
					console.log("[spr][header] ERR can't find #spr-raw-" + wofid);
					return false;
				}

				var display = raw.style.display;
				display = (display == "block") ? "" : "block";

				raw.style.display = display;				
			}
			
			var raw_el = self.render_raw(row);
			
			header_el.appendChild(name_el);
			header_el.appendChild(wofid_el);	
			header_el.appendChild(raw_el);		

			return header_el;
		},

		'render_spr_dates': function(row){

			var dates_el = document.createElement("div");			
			dates_el.setAttribute("class", "spr-dates");

			var start_el = document.createElement("span");
			start_el.setAttribute("class", "spr-dates-start");

			var stop_el = document.createElement("span");
			stop_el.setAttribute("class", "spr-dates-stop");
			
			var start = row["edtf:inception"];
			var stop = row["edtf:cessation"];			

			if ((start == "") || (start == "u")){
				start = "uuuu";
			}

			if ((stop == "") || (stop == "u")){
				stop = "uuuu";
			}

			var has_dates = true;
			
			if ((start == "uuuu") && (stop == "uuuu")){
				has_dates = false;
			}

			else if (start == "uuuu"){

				dates_el.appendChild(document.createTextNode("sometime in the past to "));				
				stop_el.appendChild(document.createTextNode(stop));
				dates_el.appendChild(stop_el);
			}

			else if (stop == "uuuu"){

				start_el.appendChild(document.createTextNode(start));				
				dates_el.appendChild(start_el);
			}

			else {
				start_el.appendChild(document.createTextNode(start));	
				stop_el.appendChild(document.createTextNode(stop));

				dates_el.appendChild(start_el);
				dates_el.appendChild(document.createTextNode(" - "));
				dates_el.appendChild(stop_el);				
			}

			return dates_el;
		},

		'render_spr_status': function(row){

			var is_current = row["mz:is_current"];
			var is_ceased = row["mz:is_ceased"];
			var is_deprecated = row["mz:is_deprecated"];
			var is_superseded = row["mz:is_superseded"];				

			var status_el = document.createElement("div");
			status_el.setAttribute("class", "spr-status");
			
			if (is_deprecated){

				utils.append_class(status_el, "spr-status-deprecated");
				
				status_el.appendChild(document.createTextNode("This place has been deprecated."));
				
				if (is_superseded){
					status_el.appendChild(document.createTextNode("It has been superseded by [WOFID]."));
				}					
			}
			
			else if ((is_ceased) || (is_current == 0)){

				utils.append_class(status_el, "spr-status-ceased");
				
				status_el.appendChild(document.createTextNode("This place is no longer \"current\"."));
				
				if (is_superseded){
					status_el.appendChild(document.createTextNode("It has been superseded by [WOFID]."));
				}					
			}
			
			else if (is_superseded){

				utils.append_class(status_el, "spr-status-superseded");
				
				status_el.appendChild(document.createTextNode("This place has been superseded by [WOFID]."));
			}
			
			else if (is_current == 1){

				utils.append_class(status_el, "spr-status-current");
				
				status_el.appendChild(document.createTextNode("We believe this place is \"current\""));
			}
			
			else {

				utils.append_class(status_el, "spr-status-unknown");
				
				status_el.appendChild(document.createTextNode("This place exists in a state of uncertainty."));				
			}

			return status_el;
		},
		
		'render_spr_details': function(row){

			var meta_el = document.createElement("div");
			meta_el.setAttribute("class", "spr-details");
			
			var addr_el = document.createElement("div");
			addr_el.setAttribute("class", "spr-details-address");
			addr_el.appendChild(document.createTextNode(row["addr:full"]));

			var centroid_el = document.createElement("ul");
			centroid_el.setAttribute("class", "list-inline spr-details-centroid");

			var lat = row["geom:latitude"];
			var lon = row["geom:longitude"];

			if ((row["lbl:latitude"]) && (row["lbl:longitude"])){
				lat = row["lbl:latitude"];
				lon = row["lbl:longitude"];
			}

			lat = lat.toFixed(6);
			lon = lon.toFixed(6);			

			var lat_el = document.createElement("li");
			lat_el.setAttribute("class", "spr-details-centroid-latitude");
			lat_el.appendChild(document.createTextNode(lat));

			var lon_el = document.createElement("li");
			lon_el.setAttribute("class", "spr-details-centroid-longitude");			
			lon_el.appendChild(document.createTextNode(lon));
			
			centroid_el.appendChild(lat_el);
			centroid_el.appendChild(lon_el);

			addr_el.appendChild(centroid_el);
			
			meta_el.appendChild(addr_el);
			
			if (row["wof:tags"]){
				
				var tags_el = document.createElement("ul");
				tags_el.setAttribute("class", "list-inline spr-details-tags");
				
				var tags = row["wof:tags"];
				var count_tags = tags.length;
				
				for (var j=0; j < count_tags; j++){
					
					var t = tags[j];
					
					var tag_item = document.createElement("li");
					tag_item.appendChild(document.createTextNode(t));
					tags_el.appendChild(tag_item);
				}
				
				meta_el.appendChild(tags_el);
			}
			
			return meta_el;
		},

		'render_spr_visits': function(row){

			var wofid = row["wof:id"];

			var visits_el = document.createElement("div");
			visits_el.setAttribute("class", "spr-visits");
			visits_el.setAttribute("id", "spr-visits-" + wofid);

			return visits_el;
		},

		'render_spr_visits_trigger': function(){

			var trigger = function(row){

				var wofid = row["wof:id"];
				console.log("[spr][visits] INFO invoke visits trigger for " + wofid);
				
				var visits_el = document.getElementById("spr-visits-" + wofid);

				if (! visits_el){
					console.log("[spr][visits] ERR can not find #spr-visits-" + wofid);
					return;
				}
				
				var visits = require("./mapzen.whosonfirst.bookmarks.visits.js");
			
				visits.get_visits_for_place(wof_id, function(err, rows){
					
					if (err){
						console.log("[spr][visits] ERR", err);
						return false;
					}
					
					if (rows.length == 0){
						console.log("[spr][visits] INFO no visits for " + wofid);						
						return true;
					}
					
					var visits_more = {};
					var visits_rows = visits.render_visits(rows, visits_more);

					visits_el.appendChild(visits_rows);
				});
			};

			return trigger;
		},
		
		'render_spr_edit': function(row){

			var status_el = document.createElement("div");
			status_el.setAttribute("class", "spr-edit");

			var is_current = row["mz:is_current"];
			
			if (is_current == 1){

				var property = "properties.mz:is_current";
				
				var options = {
					0: "this place is",
					2: "closed",
					3: "unknown",
				};

				var select_soundbox = soundbox.render_menu(row["wof:id"], property, options);

				var soundbox_wrapper = document.createElement("div");
				soundbox_wrapper.setAttribute("class", "spr-edit-soundbox spr-soundbox");
				soundbox_wrapper.appendChild(select_soundbox);
				
				status_el.appendChild(soundbox_wrapper);
			}

			else if (is_deprecated){
				// pass
			}
			
			else if ((is_current == -1) || (is_current == undefined)){

				var property = "properties.mz:is_current";
				
				var options = {
					0: "this place is",
					1: "open",
					2: "closed",
					3: "unknown",
				};

				var select_soundbox = soundbox.render_menu(row["wof:id"], property, options);

				var soundbox_wrapper = document.createElement("div");
				soundbox_wrapper.setAttribute("class", "spr-edit-soundbox spr-soundbox");
				soundbox_wrapper.appendChild(select_soundbox);
				
				status_el.appendChild(soundbox_wrapper);
			}

			else {}

			var desire_wrapper = document.createElement("div");
			desire_wrapper.setAttribute("class", "spr-edit-desires spr-desires");
			
			var select_desire = desires.render_menu(null, function(){

			});

			desire_wrapper.appendChild(select_desire);
			status_el.appendChild(desire_wrapper);

			/*

			lists.get_lists(function(err, rows){

				if (err){
					return false;
				}

				var cb = function(){};
				
				var lists_menu = lists.render_lists_menu(rows, cb);

				var els = document.getElementsByClassName("spr-lists");
				var count_els = els.length;

				for (var i=0; i < count_els; i++){
					els[i].appendChild(lists_menu);
				}
				
			});

			*/
			
			var lists_wrapper = document.createElement("div");
			lists_wrapper.setAttribute("class", "spr-edit-lists spr-lists");

			status_el.appendChild(lists_wrapper);			
			return status_el;
		},

		'render_raw': function(row){

			var str_row = JSON.stringify(row, null, "\t");
			
			var raw_el = document.createElement("div");
			raw_el.setAttribute("id", "spr-raw-" + row["wof:id"]);
			raw_el.setAttribute("class", "spr-raw");

			var dump_el = document.createElement("pre");
			dump_el.appendChild(document.createTextNode(str_row));

			raw_el.appendChild(dump_el);
			return raw_el;
		},
		
	};

	return self;
}));
