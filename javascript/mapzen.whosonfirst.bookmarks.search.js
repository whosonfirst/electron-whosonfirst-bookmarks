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

	const api = require("./mapzen.whosonfirst.api.js");

	const db = require("./mapzen.whosonfirst.bookmarks.database.js");	
	const conn = db.conn();
	
	const places = require("./mapzen.whosonfirst.bookmarks.places.js");
	const visits = require("./mapzen.whosonfirst.bookmarks.visits.js");
	
	const canvas = require("./mapzen.whosonfirst.bookmarks.canvas.js");
	const utils = require("./mapzen.whosonfirst.utils.js");	

	// const parrot = require("./mapzen.whosonfirst.partyparrot.js");
	
	var self = {
		
		'init': function(){

			var submit = document.getElementById("search-submit");
			
			submit.onclick = function(){

				try {
					self.search();
				}

				catch(e){
					console.log(e);
				}
				
				return false;
			}
			
		},

		'parse_query': function(q, cb){

			var re_wofid = /(?:wof)?id\:\s?(\d+)/;
			var m_wofid = q.match(re_wofid);
			
			if (m_wofid){

				var wofid = m_wofid[1];
				places.show_place(wofid);
				return;
			}

			var params = { "names": q };
			
			var re_place = /(locality|loc|city|neighbourhood|neighborhood|hood)\:\s*(?:(\d+)|"([^"]+)")\s+(.*)/;

			// str = 'city: "san francisco" donuts and burgers'
			// str.match(re)
			// Array [ "hood: "san francisco" donuts and bu…", "hood", undefined, "san francisco", "donuts and burgers" ]

			// str = "hood:12345 carrots"
			// str.match(re)
			// Array [ "city:12345 carrots", "city", "12345", undefined, "carrots" ]

			var m_place = q.match(re_place);
			
			// console.log(q);
			// console.log(m);
			
			if (m_place) {

				var focus = m_place[1];
				var wofid = m_place[2];
				var place = m_place[3];
				var query = m_place[4];

				if (wofid){

					if ((focus == "locality") || (focus == "loc") || (focus == "city")){

						params["locality_id"] = wofid;
						params["names"] = query;
					}

					else {
						params["neighbourhood_id"] = wofid;
						params["names"] = query;
					}
				}

				else {

					params["names"] = query;

					var place_name;
					var place_type;
					var place_country;

					var re_country = /^(.*)\s*,\s*(\w{2})$/;
					var m_country = place.match(re_country);

					if (m_country){
						place_name = m_country[1];
						place_country = m_country[2];
					}

					else {
						place_name = place;
					}
					
					if ((focus == "locality") || (focus == "loc") || (focus == "city")){
						place_type = "locality";
					}

					else {
						place_type = "neighbourhood";
					}

					var on_lookup = function(rsp){

						var wofid;
						
						var _places = rsp["places"];
						var count = _places.length;

						for (var i =0; i < count; i++){

							var row = _places[i];
							var name = row['wof:name'];

							if (name.toUpperCase() == place_name.toUpperCase()){
								wofid = row['wof:id'];
								break;
							}
						}
						
						if (! wofid){
							console.log("Missing WOF ID");
							console.log(_places);
							return;
						}
						
						if (place_type == "locality"){
							params["locality_id"] = wofid;
						}

						else {
							params["neighbourhood_id"] = wofid;
						}

						cb(params);
					};

					var args = {
						"name": place_name,
						"placetype": place_type,
					};

					if (place_country){
						args["iso"] = place_country;
					}

					self.lookup_place(args, on_lookup);
					return;
				}
			}
			
			cb(params);
		},

		'lookup_place': function(args, cb){

			var method = "whosonfirst.places.search";
			
			args["per_page"] = 15;

			var api_key = document.body.getAttribute("data-api-key");
			var api_endpoint = document.body.getAttribute("data-api-endpoint");

			api.set_handler('authentication', function(){
                                return api_key;
                        });
			
                        api.set_handler('endpoint', function(){
                                return api_endpoint;
                        });

			var on_success = function(rsp){
				cb(rsp);
			};

			api.execute_method(method, args, on_success);
		},
		
		'search': function(){

			var q = document.getElementById("q");
			q = q.value;

			self.parse_query(q, self.search2);
		},

		'search2': function(args){
			
			// var by = document.getElementById("by");
			// by = by.value;

			var api_key = document.body.getAttribute("data-api-key");
			var api_endpoint = document.body.getAttribute("data-api-endpoint");

			api.set_handler('authentication', function(){
                                return api_key;
                        });
			
                        api.set_handler('endpoint', function(){
                                return api_endpoint;
                        });

			var method = "whosonfirst.places.search";

			args["extras"] = "addr:,edtf:,geom:,lbl:,mz:,wof:hierarchy,wof:tags";
			args["per_page"] = 15;

			var on_success = function(rsp){

				var possible = rsp["places"];
				var count = possible.length;

				var list = document.createElement("ul");
				list.setAttribute("id", "search-results");				
				list.setAttribute("class", "list");

				for (var i=0; i < count; i++){

					var pl = possible[i];
					var name = pl["wof:name"];

					var item = document.createElement("li");
					item.setAttribute("id", "wof-" + pl["wof:id"]);					
					item.setAttribute("data-place", JSON.stringify(pl));
					
					item.appendChild(document.createTextNode(name));

					if (pl["addr:full"]){

						var addr = document.createElement("small");
						addr.appendChild(document.createTextNode(pl["addr:full"]));
						
						item.appendChild(addr);
					}
					
					item.onclick = function(e){
						var el = e.target;
						var pl = el.getAttribute("data-place");

						places.draw_place(pl);
					};
					
					list.appendChild(item);

					db.get_visit_count_for_place(pl["wof:id"], function(err, row){
						
						if (err){
							console.log(err);
							return;
						}

						var wof_id = row["wof_id"];
						var count = row["count_visits"];

						if (! count){
							return;
						}
						
						var el = document.getElementById("wof-" + wof_id);
						el.setAttribute("data-visit-count", count);
						utils.append_class(el, "visited");
					});
					
				}

				canvas.draw(list);
			};

			var on_error = function(rsp){
				console.log("SAD FACE");
				console.log(rsp);
			};

			api.execute_method(method, args, on_success, on_error);
		}
	}

	return self;
}));
