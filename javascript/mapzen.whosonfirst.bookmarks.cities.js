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

	const places = require("./mapzen.whosonfirst.bookmarks.places.js");	
	const canvas = require("./mapzen.whosonfirst.bookmarks.canvas.js");
	
	var self = {
		
		'init': function(){
		},

		'show_cities': function(){

			var sql = "SELECT locality_id, COUNT(id) AS count_visits FROM visits GROUP BY locality_id ORDER BY count_visits DESC";
			var params = [];

			var cb = function(err, rows){

				if (err){
					console.log(err);
					return false;
				}
				
				self.draw_cities(rows);
			};

			conn.all(sql, params, cb);
		},

		'draw_cities': function(rows){

			var count = rows.length;
			var list = document.createElement("ul");
			list.setAttribute("id", "cities-list");
			
			for (var i=0; i < count; i++){
				
				var row = rows[i];
				var locality_id = row['locality_id'];
				var count = row['count_visits'];				

				var v = document.createElement("li");

				var span = document.createElement("span");
				span.setAttribute("class", "place-name");
				span.setAttribute("id", "place-name-" + locality_id);				
				span.setAttribute("data-wof-id", locality_id);
				span.appendChild(document.createTextNode(locality_id));

				v.appendChild(span);

				if (count == 1){
					v.appendChild(document.createTextNode("you've mentioned this place once"));
				}

				else {
					v.appendChild(document.createTextNode("you've mentioned this place " + count + " times"));								}

				// because we need to trap locality_id in case we need to fetch it again...
				
				var get_place = function(id){
					
					var cb = function(err, row){

						var set_name = function(pl){
							
							var wofid = pl["wof:id"];
							var name = pl["wof:name"];

							var el = document.getElementById("place-name-" + wofid);

							if (! el){
								console.log("Missing element");
								return false;
							}
							
							el.innerText = name;
						};
						
						if (err){
							console.log(err);
							return false;
						}
						
						if (! row){
							
							places.fetch_place(id, function(pl){
								places.save_place(pl);
								set_name(pl);
							});
							
							return;
						}
						
						var wofid = row["wof_id"];
						var body = row["body"];
						
						var pl = JSON.parse(body);
						set_name(pl);
					};
					
					places.get_place(id, cb);
				};

				get_place(locality_id);
				
				list.appendChild(v);
			}

			var cities = document.createElement("div");
			cities.setAttribute("id", "cities");
			cities.appendChild(list);

			canvas.draw(cities);
		}
		
	}

	return self;
}));
