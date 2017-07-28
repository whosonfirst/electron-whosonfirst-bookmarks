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

	const electron = require('electron');
	const app = electron.app || electron.remote.app;
	
	const mkdirp = require('mkdirp');
	const path = require('path');
	const fs = require('fs');

	const udata = app.getPath("userData");
	const tile_cache = path.join(udata, "tiles.db");
	
	var self = {

		'init': function(){

			// please write me...
			// https://github.com/mapbox/node-mbtiles/blob/master/lib/mbtiles.js
			
			return false;
		},

		'get': function(key){

			var z, x, y = self.key_to_zxy(key);
			
			// please write me with a waitgroup...
			// getTile(z, x, y, cb)
		},

		'set': function(key, data){

			var z, x, y = self.key_to_zxy(key);
			
			// please write me with a waitgroup...			
			// getTile(z, x, y, data, cb)			
		},

		'key_to_zxy': function(key){

		}
	};

	return self;
}));

