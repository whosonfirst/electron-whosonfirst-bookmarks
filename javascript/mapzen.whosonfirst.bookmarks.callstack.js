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

	var stack = [];
	
	var self = {
		
		'init': function(){

		},

		'push': function(f){

			if (typeof(f) != "function"){
				return false;
			}

			stack.push(f);
		},

		'pop': function(){

			if (stack.length == 0){
				return;
			}

			return stack.pop();
		},
	}

	return self;
}));
