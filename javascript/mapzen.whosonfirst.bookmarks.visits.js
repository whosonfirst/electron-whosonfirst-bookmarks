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

	var db = require("./mapzen.whosonfirst.bookmarks.database.js");	
	var canvas = require("./mapzen.whosonfirst.bookmarks.canvas.js");
	var desires = require("./mapzen.whosonfirst.bookmarks.desires.js");	
	
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
				span.appendChild(document.createTextNode(row['name']));

				v.appendChild(span);
				v.appendChild(document.createTextNode("You said "));
				v.appendChild(q);
				v.appendChild(document.createTextNode(" on or around "));
				v.appendChild(document.createTextNode(row['date']));
				
				var remove = document.createElement("button");
				remove.setAttribute("class", "btn btn-sm");
				remove.setAttribute("data-visit-id", row['id']);
				
				remove.appendChild(document.createTextNode("x"));
				
				remove.onclick = function(e){
					
					var el = e.target;
					var id = el.getAttribute("data-visit-id");
					
					if (! confirm("Are you sure you want to delete this visit?")){
						return false;
					}
					
					db.remove_visit(id, function(){
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
		}
		
	}

	return self;
}));
