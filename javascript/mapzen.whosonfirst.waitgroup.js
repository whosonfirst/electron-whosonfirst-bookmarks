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
		
		g.mapzen = g.mapzen || {};
		g.mapzen.whosonfirst = g.mapzen.whosonfirst || {};
		g.mapzen.whosonfirst.waitgroup = g.mapzen.whosonfirst.waitgroup = f();		
        }
	
}(function(){
	
	var pending = 0;
	
	var self = {
		
		'add': function(i){
			pending += i;
		},

		'done': function(){
			pending -= 1;
		},

		'wait': function(cb){

			if (! pending){
				cb();
				return;
			}
			
			var _this = self;

			setTimeout(function(){
				_this.wait(cb);
			}, 1);
		}
	}
	
	return self;
}));
