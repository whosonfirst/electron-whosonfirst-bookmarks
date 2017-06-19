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

	console.log("PLACES");
	
	const db = require("./mapzen.whosonfirst.bookmarks.database.js");
	const conn = db.conn();
	
	const canvas = require("./mapzen.whosonfirst.bookmarks.canvas.js");
	const desires = require("./mapzen.whosonfirst.bookmarks.desires.js");

	const api = require("./mapzen.whosonfirst.api.js");
	
	var self = {
		
		'init': function(){

		},

		'fetch_place': function(id, cb){

			var method = "whosonfirst.places.getInfo";
			
			var args = {
				"id": id,
				"extras": "addr:,edtf:,geom:,lbl:,wof:hierarchy,wof:tags"
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
				console.log("SAD FACE");
				console.log(rsp);
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
			
			// console.log(pl);
			
			var lat = pl["geom:latitude"];
			var lon = pl["geom:longitude"];			

			if ((pl["lbl:latitude"]) && (pl["lbl:longitude"])){

				lat = pl["lbl:latitude"];
				lon = pl["lbl:longitude"];				
			}

			var h2 = document.createElement("h2");
			h2.appendChild(document.createTextNode(pl["wof:name"]));

			if (pl["addr:full"]){
				
				var addr = document.createElement("small");
				addr.appendChild(document.createTextNode(pl["addr:full"]));

				h2.appendChild(addr);
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
			// controls.appendChild(routing_select);
			// controls.appendChild(routing_button);
			
			var visits_wrapper = document.createElement("div");
			visits_wrapper.setAttribute("id", "visits");
			
			var wrapper = document.createElement("div");
			wrapper.appendChild(h2);
			wrapper.appendChild(map);
			wrapper.appendChild(controls);
			wrapper.appendChild(visits_wrapper);
			
			canvas.draw(wrapper);

			var api_key = document.body.getAttribute("data-api-key");			
			L.Mapzen.apiKey = api_key;

			var map = L.Mapzen.map('map', {
    				tangramOptions: {
    					scene: L.Mapzen.BasemapStyles.Refill
    				}
			});
			
			map.setView([lat, lon], 16);

			L.marker([lat, lon]).addTo(map);
			self.draw_visits_list(pl);
		},

		'draw_visits_list': function(pl){

			db.get_visits_for_place(pl['wof:id'], function(err, rows){

				if (err){
					console.log(err);
					return;
				}

				var count = rows.length;
				var list = document.createElement("ul");

				for (var i=0; i < count; i++){

					var row = rows[i];
					var status_id = row['status_id'];
					var desire = desires.id_to_label(status_id);
					
					var q = document.createElement("q");
					q.appendChild(document.createTextNode(desire));
					
					var v = document.createElement("li");
					v.appendChild(document.createTextNode("You said "));
					v.appendChild(q);
					v.appendChild(document.createTextNode(" on or around "));
					v.appendChild(document.createTextNode(row['date']));

					var remove = document.createElement("button");
					remove.setAttribute("class", "btn btn-sm remove");
					remove.setAttribute("data-visit-id", row['id']);
					
					remove.appendChild(document.createTextNode("⃠"));

					remove.onclick = function(e){

						var el = e.target;
						var id = el.getAttribute("data-visit-id");

						if (! confirm("Are you sure you want to delete this visit?")){
							return false;
						}

						var visits = require("./mapzen.whosonfirst.bookmarks.visits.js");
						
						visits.remove_visit(id, function(){
							self.draw_visits_list(pl);
						});

						return false;
					};
					
					v.appendChild(remove);
					
					list.appendChild(v);
				}

				var visits_wrapper = document.getElementById("visits");
				visits_wrapper.innerHTML = "";
				
				visits_wrapper.appendChild(list);
			});

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
