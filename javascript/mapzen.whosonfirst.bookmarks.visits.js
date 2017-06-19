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

	console.log("VISITS");
	
	var db = require("./mapzen.whosonfirst.bookmarks.database.js");
	var conn = db.conn();
	
	var canvas = require("./mapzen.whosonfirst.bookmarks.canvas.js");
	var desires = require("./mapzen.whosonfirst.bookmarks.desires.js");	

	var places = require("./mapzen.whosonfirst.bookmarks.places.js");
	
	var self = {
		
		'init': function(){
			
		},

		'show_visits': function(){

			db.get_visits(function(err, rows){

				if (err){
					console.log(err);
					return false;
				}
				
				self.draw_visits(rows);
			});
		},

		'draw_visits': function(rows){

			var count = rows.length;
			var list = document.createElement("ul");
			
			for (var i=0; i < count; i++){
				
				var row = rows[i];
				var status_id = row['status_id'];
				var desire = desires.id_to_label(status_id);
				
				var q = document.createElement("q");
				q.appendChild(document.createTextNode(desire));
				
				var v = document.createElement("li");

				var span = document.createElement("span");
				span.setAttribute("class", "place-name");
				span.setAttribute("data-wof-id", row['wof_id']);	
				span.appendChild(document.createTextNode(row['name']));

				span.onclick = function(e){
					var el = e.target;
					var wof_id = el.getAttribute("data-wof-id");

					places.show_place(wof_id);
				};
				
				v.appendChild(span);
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
					
					self.remove_visit(id, function(){
						self.show_visits();
					});
					
					return false;
				};
				
				v.appendChild(remove);
				
				list.appendChild(v);
			}

			var visits = document.createElement("div");
			visits.setAttribute("id", "visits");
			visits.appendChild(list);

			canvas.draw(visits);
		},

		'add_visit': function(pl, status_id, cb){

			var on_save = function(err){

				places.save_place(pl);
				places.save_hierarchy(pl);

				cb(err);
			};

			self.save_visit(pl, status_id, on_save);
		},
		
		'save_visit': function(pl, status_id, cb){

			var wof_id = pl['wof:id'];
			var name = pl['wof:name'];			
			var lat = pl['geom:latitude'];
			var lon = pl['geom:longitude'];			

			var hier = pl['wof:hierarchy'];
			hier = hier[0];				// PLEASE FIX ME

			var neighbourhood_id = hier['neighbourhood_id'];
			var locality_id = hier['locality_id'];
			var region_id = hier['region_id'];
			var country_id = hier['country_id'];			

			var dt = new Date;
			dt = dt.toISOString();

			var sql = "INSERT INTO visits (wof_id, name, latitude, longitude, neighbourhood_id, locality_id, region_id, country_id, status_id, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
			
			var params = [wof_id, name, lat, lon, neighbourhood_id, locality_id, region_id, country_id, status_id, dt];

			conn.run(sql, params, cb);
		},

		'remove_visit': function(visit_id, cb){

			var sql = "DELETE FROM visits WHERE id = ?";
			var params = [ visit_id ];

			conn.run(sql, params, cb);
		},
		
		
	}

	return self;
}));
