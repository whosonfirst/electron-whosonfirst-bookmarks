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

	var self = {
		
		'append_class': function(el, class_name){

			if (! el){
				console.log("trying to call append_class on a null element");
				return;
			}
			
			var c = el.getAttribute("class");
			c = (c) ? c.split(" ") : [];
			
			c.push(class_name);
			c = c.join(" ");
			
			el.setAttribute("class", c);
		},
		
		'remove_class': function(el, class_name){
			
			if (! el){
				console.log("trying to call remove_class on a null element");
				return;
			}

			var c = el.getAttribute("class");
			c = (c) ? c.split(" ") : [];			

			var count = c.length;
			var tmp = [];

			for (var i = 0; i < count; i++){

				var cl = c[i];

				if (cl != class_name){
					tmp.push(cl);
				}
			}

			c = tmp.join(" ");
			el.setAttribute("class", c);
		}
		
	};

	return self;

}));
