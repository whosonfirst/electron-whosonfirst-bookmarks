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

	const desires = {
		0: "i've been there",
		1: "i was there",
		2: "i want to go there",
		3: "again again",
		4: "again",
		5: "again maybe",
		6: "again never",
		7: "meh"
	};
	
	var self = {

		'get_list': function(){
			return desires;
		},
		
		'id_to_label': function(id){
			return desires[id];
		}
	};
	
	return self;
}));
