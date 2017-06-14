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

	var _timeout = undefined;
	
	var self = {
		
		'start': function(msg, ttl){
			
			var el = document.getElementById("party-parrot");
			
			if (! el){
				return false;
			}

			el.innerHTML = "";
			
			var img = document.createElement("img");
			img.setAttribute("src", "images/party-parrot.gif");

			var span = document.createElement("span");
			span.setAttribute("id", "party-parrot-text");
			span.setAttribute("class", "triangle-border right");
			span.appendChild(document.createTextNode(msg));

			el.appendChild(span);
			el.appendChild(img);

			ttl = parseInt(ttl);
			
			if (ttl){

				if (_timeout){
					clearTimeout(_timeout);
				}
				
				_timeout = setTimeout(function(){
					self.stop();
				}, ttl);
			}
			
			return true;
		},

		'stop': function() {

			var el = document.getElementById("party-parrot");

			if (! el){
				return false;
			}
			
			el.innerHTML = "";
			return true;
		},
		
	};

	return self;

}));
