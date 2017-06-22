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

			var sql = "SELECT * FROM places WHERE wof_id = ?";
			var params = [ id ];

			console.log(sql, params);
			
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

			if (typeof(pl) == "string"){
				pl = JSON.parse(pl);
			}
			
			var lat = pl["geom:latitude"];
			var lon = pl["geom:longitude"];			

			if ((pl["lbl:latitude"]) && (pl["lbl:longitude"])){

				lat = pl["lbl:latitude"];
				lon = pl["lbl:longitude"];				
			}
			
			var map = document.createElement("div");
			map.setAttribute("id", "map");
			map.setAttribute("data-place", JSON.stringify(pl));
			
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

				console.log("place " + lat + ", " + lon);
				
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
			// 
			// controls.appendChild(routing_select);
			// controls.appendChild(routing_button);
			
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
			
			var details = self.render_place_details(pl);
			
			var left_panel = document.createElement("div");
			left_panel.setAttribute("class", "col-md-6 panel");

			var right_panel = document.createElement("div");
			right_panel.setAttribute("class", "col-md-6 panel");
			
			left_panel.appendChild(map);
			left_panel.appendChild(controls);
			
			right_panel.appendChild(h2);
			right_panel.appendChild(visits_wrapper);			
			right_panel.appendChild(details);
			
			canvas.reset();
			canvas.append(left_panel);
			canvas.append(right_panel);			

			var api_key = document.body.getAttribute("data-api-key");			
			L.Mapzen.apiKey = api_key;

			var map = L.Mapzen.map('map', {
    				tangramOptions: {
    					scene: L.Mapzen.BasemapStyles.Refill
    				}
			});

			geojson.add_latlon_to_map(map, lat, lon);

			self.draw_visits_list(pl, map);
		},

		'render_place_details': function(pl){

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
		
		'draw_visits_list': function(pl, map){

			var visits = require("./mapzen.whosonfirst.bookmarks.visits.js");

			var wof_id = pl['wof:id'];
			var pt = pl["wof:placetype"];

			var cb = function(err, rows){

				if (err){
					fb.error(err);
					return;
				}
				
				var visits = require("./mapzen.whosonfirst.bookmarks.visits.js");
				var list = visits.render_visits(rows);

				var expandable = utils.render_expandable(list, { "label": "visits", "open": true });
				
				var visits_wrapper = document.getElementById("visits");
				visits_wrapper.innerHTML = "";
				
				visits_wrapper.appendChild(expandable);
				
				namify.translate();

				geojson.add_visits_to_map(map, rows);
			};
			
			switch (pt) {

			case "venue":
			
				db.get_visits_for_place(wof_id, cb);
				break;
				
			case "locality":

				visits.get_visits_for_locality(wof_id, cb);
				break;
				
			case "neighbourhood":

				visits.get_visits_for_neighbourhood(wof_id, cb);
				break;
				
			default:
				fb.warning("unsupported placetype " + pt);
			}
			
		},
		
		'add_place': function(e){

			var map = document.getElementById("map");

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

			console.log("save " + name + " (" + wof_id + ")");
			
			var body = JSON.stringify(pl);

			var sql = "REPLACE INTO places (wof_id, body, created) VALUES (?, ?, ?)";
			var params = [ wof_id, body, dt ];

			console.log(sql, params);
			
			var dt = new Date;
			dt = dt.toISOString();

			conn.run(sql, params, cb);
		},

		'save_hierarchy': function(pl, cb){

			var wof_id = pl['wof:id'];
			var hierarchies = pl['wof:hierarchy'];
			var count = hierarchies.length;

			console.log("SAVE HIER " + count);

			var possible = ['neighbourhood_id', 'locality_id', 'region_id', 'country_id' ];
			
			for (var i=0; i < count; i++){

				var hier = hierarchies[i];

				for (var p in possible){

					var k = possible[p];
					
					console.log("MAYBE " + k);
					
					if (! hier[k]){
						continue;
					}

					if (hier[k] == wof_id){
						continue;
					}

					console.log("FETCH " + hier[k]);
					
					self.fetch_place(hier[k], self.save_pl);
				}
			}
		},
	}

	return self;
}));
