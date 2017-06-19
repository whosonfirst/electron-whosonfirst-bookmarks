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

		'show_neighbourhoods': function(){

			var sql = "SELECT neighbourhood_id, COUNT(id) AS count_visits FROM visits GROUP BY neighbourhood_id ORDER BY count_visits DESC";
			var params = [];

			var cb = function(err, rows){

				if (err){
					console.log(err);
					return false;
				}
				
				self.draw_neighbourhoods(rows);
			};

			conn.all(sql, params, cb);
		},

		'draw_neighbourhoods': function(rows){

			var count = rows.length;
			var list = document.createElement("ul");
			list.setAttribute("id", "neighbourhoods-list");
			
			for (var i=0; i < count; i++){
				
				var row = rows[i];
				var neighbourhood_id = row['neighbourhood_id'];
				var count = row['count_visits'];				

				var v = document.createElement("li");

				var span = document.createElement("span");
				span.setAttribute("class", "place-name");
				span.setAttribute("id", "place-name-" + neighbourhood_id);				
				span.setAttribute("data-wof-id", neighbourhood_id);
				span.appendChild(document.createTextNode(neighbourhood_id));

				v.appendChild(span);

				if (count == 1){
					v.appendChild(document.createTextNode("you've mentioned this place once"));
				}

				else {
					v.appendChild(document.createTextNode("you've mentioned this place " + count + " times"));								}

				// because we need to trap neighbourhood_id in case we need to fetch it again...
				
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

				get_place(neighbourhood_id);
				
				list.appendChild(v);
			}

			var neighbourhoods = document.createElement("div");
			neighbourhoods.setAttribute("id", "neighbourhoods");
			neighbourhoods.appendChild(list);

			canvas.draw(neighbourhoods);
		}
		
	}

	return self;
}));
