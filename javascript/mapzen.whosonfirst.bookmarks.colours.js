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

	const utils = require("./mapzen.whosonfirst.utils.js");
	
	var self = {

		'label_colour': function(label){
			return utils.dopplr_colour(label);
		},
		
		'desire_colour': function(desire){

			var dopplr_colour = utils.dopplr_colour(desire);
			return dopplr_colour;
			
			if (desire == "i've been there"){

			}

			else if (desire == "i was there"){

			}

			else if (desire == "i want to go there"){

			}

			else if (desire == "again again"){

			}

			else if (desire == "again"){

			}

			else if (desire == "again maybe"){

			}

			else if (desire == "again never"){

			}

			else if (desire == "meh"){

			}

			else if (desire == "i would try this"){

			}

			else {
				return dopplr_colour;
			}
		},
		
		'status_colour': function(spr){

			var is_current = spr["mz:is_current"];
			var is_ceased = spr["mz:is_ceased"];
			var is_deprecated = spr["mz:is_deprecated"];
			var is_superseded = spr["mz:is_superseded"];				

			if (is_deprecated){
				return "#dc143c";		// crimson (css4)
			}
			
			else if ((is_ceased) || (is_current == 0)){
				return "#ffa500";		// orange (css4)
			}
			
			else if (is_superseded){
				return "#1e90ff";		// dodgerblue (css4)
			}
			
			else if (is_current == 1){
				return "#8fd400";		// sheengreen (crayola)
			}
			
			else {
				return "#f0e68c";		// khaki (css4)
			}
		}
	};

	return self;
}));
