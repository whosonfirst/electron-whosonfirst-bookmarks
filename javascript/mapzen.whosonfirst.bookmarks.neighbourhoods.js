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
				span.setAttribute("data-wof-id", neighbourhood_id);
				span.appendChild(document.createTextNode(neighbourhood_id));

				v.appendChild(document.createTextNode("..." + count + " times"));								
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
