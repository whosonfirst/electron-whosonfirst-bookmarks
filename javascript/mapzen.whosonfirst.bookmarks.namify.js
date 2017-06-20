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

	const fb = require("./mapzen.whosonfirst.bookmarks.feedback.js");	
	
	var cache = {};
	
	var self = {
		
		'init': function(){
			
		},

		'translate': function(class_name, data_attr){

			if (! class_name){
				class_name = "namify";
			}

			if (! data_attr){
				data_attr = "data-wof-id";
			}
			
			var els = document.getElementsByClassName(class_name);
			var count = els.length;

			for (var i=0; i < count; i++){

				var el = els[i];
				var id = el.getAttribute(data_attr);

				if (! id){
					continue;
				}

				var name = cache[id];

				if (name){
					el.innerText = name;
					continue;
				}

				self.get_name(el, id);
			}
		},

		'get_name': function(el, id){

			var places = require("./mapzen.whosonfirst.bookmarks.places.js");
			
			var cb = function(err, row){

				var set_name = function(pl){
					
					var wofid = pl["wof:id"];
					var name = pl["wof:name"];
					
					el.innerText = name;
					cache[wofid] = name;
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
		}
		
	}

	return self;
}));
