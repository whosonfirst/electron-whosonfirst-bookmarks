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
	const place = require("./mapzen.whosonfirst.bookmarks.place.js");
	const canvas = require("./mapzen.whosonfirst.bookmarks.canvas.js");
	const parrot = require("./mapzen.whosonfirst.partyparrot.js");
	const utils = require("./mapzen.whosonfirst.utils.js");	
	
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

			var params = { "names": q };

			var re = /(locality|loc|city|neighbourhood|neighborhood|hood)\:\s*(?:(\d+)|"([^"]+)")\s+(.*)/;

			// str = 'city: "san francisco" donuts and burgers'
			// str.match(re)
			// Array [ "hood: "san francisco" donuts and bu…", "hood", undefined, "san francisco", "donuts and burgers" ]

			// str = "hood:12345 carrots"
			// str.match(re)
			// Array [ "city:12345 carrots", "city", "12345", undefined, "carrots" ]

			var m = q.match(re);

			if (m) {

				var focus = m[1];
				var wofid = m[2];
				var place = m[3];
				var query = m[4];

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

					// lookup 'place' of placetype 'focus' here...
				}
			}
			
			cb(params);
		},
		
		'search': function(){

			var q = document.getElementById("q");
			q = q.value;

			self.parse_query(q, function(params){
				console.log("params");
				console.log(params);
			});
			
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
			
			var args = {
				"names": q,
				"extras": "addr:,geom:,wof:hierarchy,wof:tags",
				"per_page": 15,
			};

			var on_success = function(rsp){

				parrot.stop();
				
				var places = rsp["places"];
				var count = places.length;

				var list = document.createElement("ul");
				list.setAttribute("id", "search-results");				
				list.setAttribute("class", "list");

				for (var i=0; i < count; i++){

					var pl = places[i];
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

						// pl = JSON.parse(pl);

						place.draw_place(pl);
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
			parrot.start("searching!");
		}
	}

	return self;
}));
