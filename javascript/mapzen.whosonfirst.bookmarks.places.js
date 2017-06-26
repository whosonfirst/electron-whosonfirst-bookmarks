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

	const namify = require("./mapzen.whosonfirst.bookmarks.namify.js");
	
	const canvas = require("./mapzen.whosonfirst.bookmarks.canvas.js");
	const desires = require("./mapzen.whosonfirst.bookmarks.desires.js");

	const api = require("./mapzen.whosonfirst.api.js");
	const geojson = require("./mapzen.whosonfirst.bookmarks.geojson.js");
	const maps = require("./mapzen.whosonfirst.bookmarks.maps.js");

	const screenshots = require("./mapzen.whosonfirst.bookmarks.screenshots.js");
	
	const utils = require("./mapzen.whosonfirst.utils.js");	
	const fb = require("./mapzen.whosonfirst.bookmarks.feedback.js");
	
	var self = {
		
		'init': function(){

		},

		'fetch_place': function(id, cb){

			var method = "whosonfirst.places.getInfo";
			
			var args = {
				"id": id,
				"extras": "addr:,edtf:,geom:,lbl:,mz:,wof:hierarchy,wof:tags"
			};

			var api_key = document.body.getAttribute("data-api-key");
			var api_endpoint = document.body.getAttribute("data-api-endpoint");

			api.set_handler('authentication', function(){
                                return api_key;
                        });
			
                        api.set_handler('endpoint', function(){
                                return api_endpoint;
                        });

			var on_success = function(rsp){
				
				var pl = rsp["place"];

				if (cb){
					cb(pl);
				}
			};

			var on_error = function(rsp){
				fb.error(rsp);
				return false;
			};

			api.execute_method(method, args, on_success, on_error);
		},

		'get_place': function(id, cb){

			if (id == -1){
				cb("Invalid WOF ID");
				return;
			}
			
			var sql = "SELECT * FROM places WHERE wof_id = ?";
			var params = [ id ];

			// console.log(sql, params);
			
			conn.get(sql, params, cb);			
		},
		
		'show_place': function(id){

			var cb = function(err, row){

				if (err){
					console.log(err);
					return false;
				}

				if (! row){
					self.fetch_place(id, self.draw_place);
					return;
				}
				
				var pl = row["body"];
				self.draw_place(pl);
			};

			self.get_place(id, cb);
		},
		
		'draw_place': function(pl){

			console.log("DRAW PLACE");
			
			if (typeof(pl) == "string"){
				pl = JSON.parse(pl);
			}

			var wof_id = pl["wof:id"];
			var pt = pl["wof:placetype"];
						
			var map_el = document.createElement("div");
			map_el.setAttribute("id", "map");
			map_el.setAttribute("data-place", JSON.stringify(pl));

			map_el.setAttribute("data-screenshot", "place");
			map_el.setAttribute("data-wof-id", wof_id);

			if (screenshots.exists(wof_id)){
				var data = screenshots.data_url(wof_id);
				map_el.setAttribute("style", "background-image: url(" + data + ")");
			}
			
			var status_select = document.createElement("select");
			status_select.setAttribute("id", "status");

			var all_desires = desires.get_list();

			for (var id in all_desires){

				var option = document.createElement("option");
				option.setAttribute("value", id);
				option.appendChild(document.createTextNode(all_desires[id]));
				
				status_select.appendChild(option);
			}
			
			var status_button = document.createElement("button");
			status_button.setAttribute("class", "btn btn-primary");
			status_button.appendChild(document.createTextNode("Save"));

			status_button.onclick = self.add_place;

			// note: we're not actually doing anything with routing yet because
			// of geolocation hoohah - see below for details...

			var enable_routing = false;
			
			if (enable_routing){
				
				var routing_select = document.createElement("select");
				routing_select.setAttribute("id", "routing");
				
				var modes = {
					"pedestrian": "by foot",
					"bicylcle": "on bike",
					"auto": "by car",
					"bus": "by transit"
				};
				
				for (var mode in modes){
					var option = document.createElement("option");
					option.setAttribute("value", mode);
					option.appendChild(document.createTextNode(modes[mode]));
					routing_select.appendChild(option);
				}
				
				var routing_button = document.createElement("button");
				routing_button.setAttribute("class", "btn");
				routing_button.appendChild(document.createTextNode("Take me there"));
				
				routing_button.onclick = function(e){
					var el = e.target;

					var on_locate = function(pos){
						var current_lat = pos.coords.latitude;
						var current_lon = pos.coords.longitude;
						console.log("current " + current_lat + "," + current_lon);
					};
					
					var on_error = function(err){
						console.log(err);
						return false;
					};
					
					navigator.geolocation.getCurrentPosition(on_locate, on_error);
				};
			}
			
			var controls = document.createElement("div");
			controls.setAttribute("id", "controls");
			controls.appendChild(status_select);
			controls.appendChild(status_button);

			// I hate everything... 20170619/thisisaaronland)
			// https://github.com/electron/electron/issues/7306			
			// https://electron.atom.io/docs/api/environment-variables/#googleapikey
			// https://www.chromium.org/developers/how-tos/api-keys which says:
			// "Google Maps Geolocation API (requires enabling billing but is free to use; you can skip
			// this one, in which case geolocation features of Chrome will not work)"
			// https://developers.google.com/maps/documentation/geolocation/intro

			if (enable_routing){
				controls.appendChild(routing_select);
				controls.appendChild(routing_button);
			}
			
			var visits_wrapper = document.createElement("div");
			visits_wrapper.setAttribute("id", "visits");

			var h2 = document.createElement("h2");
			h2.appendChild(document.createTextNode(pl["wof:name"]));

			var reload = document.createElement("small");
			reload.setAttribute("class", "control");
			reload.setAttribute("data-wof-id", pl["wof:id"]);
			reload.appendChild(document.createTextNode("⟳"));

			reload.onclick = function(e){

				var el = e.target;
				var wof_id = el.getAttribute("data-wof-id");

				self.fetch_place(wof_id, function(pl){

					self.save_place(pl, function(err){

						if (err){
							fb.error(err);
							return false;
						}

						self.draw_place(pl);
					});

					// TO DO: if place is a venue rebuild hierarchy for visits
				});
			};

			h2.appendChild(reload);

			var desires_wrapper = document.createElement("div");
			desires_wrapper.setAttribute("id", "desires");

			var lists_wrapper = document.createElement("div");
			lists_wrapper.setAttribute("id", "lists-wrapper");
			
			var dates = self.render_dates(pl);			
			var address = self.render_address(pl);
			var details = self.render_details(pl);
			
			var left_panel = document.createElement("div");
			left_panel.setAttribute("class", "col-md-6 panel");

			var right_panel = document.createElement("div");
			right_panel.setAttribute("class", "col-md-6 panel");
			
			left_panel.appendChild(map_el);
			left_panel.appendChild(controls);
			
			right_panel.appendChild(h2);
			right_panel.appendChild(address);
			right_panel.appendChild(dates);			
			right_panel.appendChild(desires_wrapper);			
			right_panel.appendChild(visits_wrapper);
			right_panel.appendChild(lists_wrapper);			
			right_panel.appendChild(details);
			
			canvas.reset();
			canvas.append(left_panel);
			canvas.append(right_panel);			

			var map = maps.new_map(map_el);
			geojson.add_place_to_map(map, pl);

			self.draw_lists(pl);
			
			self.draw_visits_list(pl, map);

			var pt = pl["wof:placetype"];

			if ((pt == "neighbourhood") || (pt == "locality") || (pt == "region") || (pt == "country")){
				
				var placetypes = require("./mapzen.whosonfirst.bookmarks.placetypes.js");
			
				placetypes.get_desires_for_placetype(pl["wof:placetype"], pl["wof:id"], function(err, rows){
					
					if (err){
						fb.error(err);
						return;
					}
					
					var desires_list = placetypes.render_desires_for_placetype(rows);
					var desires_wrapper = document.getElementById("desires");
					desires_wrapper.appendChild(desires_list);
				});
			}

			namify.translate();
		},

		'draw_lists': function(pl){

			var lists = require("./mapzen.whosonfirst.bookmarks.lists.js");

			var cb = function(err, rows){

				if (err){
					fb.error(err);
					return;
				}

				var wof_id = pl["wof:id"];

				var lists_menu = lists.render_lists_menu(rows, function(err){

					if (err){
						fb.error(err);
						return;
					}

					self.draw_lists(pl);
				});
				
				lists_menu.setAttribute("data-wof-id", wof_id);
				
				var open = true;
				var expandable = utils.render_expandable(lists_menu, { "label": "lists", "open": open });

				var lists_wrapper = document.getElementById("lists-wrapper");
				lists_wrapper.innerHTML = "";
				
				lists_wrapper.appendChild(expandable);
			};

			lists.get_lists(cb);
		},
		
		'draw_visits_list': function(pl, map){

			var visits = require("./mapzen.whosonfirst.bookmarks.visits.js");

			var wof_id = pl['wof:id'];
			var pt = pl["wof:placetype"];

			var skip_header = (pt == "venue") ? true : false;
			
			var cb = function(err, rows){

				if (err){
					fb.error(err);
					return;
				}

				var count_visits = rows.length;

				if (! count_visits){
					return;
				}
				
				var visits = require("./mapzen.whosonfirst.bookmarks.visits.js");
				var list = visits.render_visits(rows, {"skip_header": skip_header});

				var expandable = utils.render_expandable(list, { "label": "visits" });
				
				var visits_wrapper = document.getElementById("visits");
				visits_wrapper.innerHTML = "";
				
				visits_wrapper.appendChild(expandable);			

				geojson.add_visits_to_map(map, rows);

				namify.translate();				
			};
			
			switch (pt) {

			case "venue":
			
				db.get_visits_for_place(wof_id, cb);
				break;

			case "neighbourhood":

				visits.get_visits_for_neighbourhood(wof_id, cb);
				break;
				
			case "locality":

				visits.get_visits_for_locality(wof_id, cb);
				break;

			case "region":

				visits.get_visits_for_region(wof_id, cb);
				break;

			case "country":

				visits.get_visits_for_country(wof_id, cb);
				break;
				
			default:
				fb.warning("unsupported placetype " + pt);
			}
			
		},
		
		'add_place': function(e){

			var str_pl = map.getAttribute("data-place");
			var pl = JSON.parse(str_pl);			
						
			var status = document.getElementById("status");
			status = status.value;

			var visits = require("./mapzen.whosonfirst.bookmarks.visits.js");

			visits.add_visit(pl, status, function(err){

				if (err){
					console.log(err);
					return false;
				}

				var visit_id = this.lastID;
				self.draw_visits_list(pl);
			});
			
			return false;
		},

		'save_place': function(pl, cb){

			var wof_id = pl['wof:id'];
			var name = pl['wof:name'];

			var body = JSON.stringify(pl);

			var sql = "REPLACE INTO places (wof_id, body, created) VALUES (?, ?, ?)";
			var params = [ wof_id, body, dt ];

			// console.log(sql, params);
			
			var dt = new Date;
			dt = dt.toISOString();

			conn.run(sql, params, cb);
		},

		'save_hierarchy': function(pl, cb){

			var wof_id = pl['wof:id'];
			var hierarchies = pl['wof:hierarchy'];
			var count = hierarchies.length;

			var possible = ['neighbourhood_id', 'locality_id', 'region_id', 'country_id' ];
			
			for (var i=0; i < count; i++){

				var hier = hierarchies[i];

				for (var p in possible){

					var k = possible[p];
					
					if (! hier[k]){
						continue;
					}

					if (hier[k] == wof_id){
						continue;
					}

					self.fetch_place(hier[k], self.save_pl);
				}
			}
		},

		'render_details': function(pl){

			var details = utils.render_object(pl);
			return utils.render_expandable(details);
			
			var details = document.createElement("ul");
			details.setAttribute("class", "list place-details");
			details.setAttribute("id", "place-details-" + pl["wof:id"]);

			for (var k in pl){
				
				var v = pl[k];

				var k_span = document.createElement("span");
				k_span.setAttribute("class", "place-details-key");
				k_span.appendChild(document.createTextNode(k));
				
				var v_span = document.createElement("span");
				v_span.setAttribute("class", "place-details-value");
				v_span.appendChild(document.createTextNode(v));

				var item = document.createElement("li");
				item.setAttribute("class", "place-details-item");
				
				item.appendChild(k_span);
				item.appendChild(v_span);				
				
				details.appendChild(item);
			}
			
			return details;
		},
		
		'render_address': function(pl){

			var wof_id = pl["wof:id"];
			
			var addr = {
				'street': null,
				'full': null,
				'neighbourhood': null,
				'locality': null,
				'region': null,
				'country': null
			};
			
			var house_num = pl["addr:housenumber"];
			var street = pl["addr:street"];
			
			if ((house_num) && (street)){

				var txt = house_num + " " + street;
				addr['street'] = txt;
			}

			else if (street){

				addr['street'] = street;
			}

			else if (pl["addr:full"]){
				addr["full"] = pl["addr:full"];
			}
			
			else {}
			
			var hier = pl["wof:hierarchy"]

			if (hier.length){

				var hier = hier[0];	// please fix me...

				for (var k in addr){

					if (k == 'street'){
						continue;
					}

					var k_id = k + "_id";

					if ((hier[k_id]) && (hier[k_id] != wof_id)){
						addr[k] = hier[k_id];
					}
				}
			}
			
			var address = document.createElement("ul");
			address.setAttribute("class", "list-inline address");			
			address.setAttribute("id", "address-" + wof_id);
			
			for (var k in addr){

				var v = addr[k];

				if (! v){
					continue;
				}
				
				var item = document.createElement("li");
				item.setAttribute("id", "address-" + k + "-" + wof_id);
				item.setAttribute("class", "address-item address-" + k);
				item.appendChild(document.createTextNode(v));

				if ((k != "street") && (k != "full")){

					if (v < 0){
						continue;
					}
					
					utils.append_class(item, "namify");
					utils.append_class(item, "click-me");					
					item.setAttribute("data-wof-id", v);
					
					item.onclick = function(e){
						var el = e.target;
						var wof_id = el.getAttribute("data-wof-id");
						self.show_place(wof_id);
					};
				}

				address.appendChild(item);
			}

			return address;
		},

		'render_status': function(pl){
			
			var deprecated = null;
			var superseded_by = null;				
			var is_current = null;
			
		},
		
		'render_dates': function(pl){
			
			var inception = null;
			var cessation = null;
			var is_current = null;
			
			if (pl["edtf:inception"]){
				inception = pl["edtf:inception"];
			}
			
			if (pl["edtf:cessation"]){
				cessation = pl["edtf:cessation"];
			}
			
			if (pl["mz:is_current"]){
				is_current = pl["mz:is_current"];
			}
			
			if ((! inception) || (inception == "uuuu")){
				inception = "the sometime-past";
			}
			
			if ((! cessation) || (cessation == "uuuu")){
				
				cessation = "the future-maybe";
				
				if (is_current){
					cessation = "the present";
				}
			}
			
			var wof_id = pl["wof:id"];
			
			var dates = document.createElement("ul");
			dates.setAttribute("class", "list-inline dates");
			dates.setAttribute("id", "dates-" + wof_id);

			if ((is_current == 0) || ((cessation != "the future-maybe") && (cessation != "the present"))){
				utils.append_class(dates, "is-not-current");
			}
			
			var item_inception = document.createElement("li");
			item_inception.setAttribute("class", "dates-item dates-item-inception");
			item_inception.appendChild(document.createTextNode(inception));
			
			var item_cessation = document.createElement("li");
			item_cessation.setAttribute("class", "dates-item dates-item-cessation");
			item_cessation.appendChild(document.createTextNode(cessation));
			
			dates.appendChild(item_inception);
			dates.appendChild(item_cessation);
			
			return dates;
		},
	}

	return self;
}));
