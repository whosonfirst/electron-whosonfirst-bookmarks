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
	
	var self = {

		'init': function(){

			const udata = app.getPath("userData");
			const tile_cache = path.join(udata, "tiles");
			
			if (! fs.existsSync(tile_cache)){
				
				if (! fs.mkdirSync(tile_cache)){
					console.log("ARGH - can not create '" + tile_cache + "'");
					return false;
				}
			}			
		},

		'get': function(key){

			var tile_path = self.key_to_tile_path(key);
			
			if (! fs.existsSync(tile_path)){
				return;
			}
			
			var fh = fs.openSync(tile_path, "r");
			
			if (! fh){
				return;
			}
			
			return fs.readFileSync(fh);
		},

		'set': function(key, data){

			var tile_path = self.key_to_tile_path(key);
			var tile_root = path.dirname(tile_path);
			
			if (! fs.existsSync(tile_root)){
				
				// console.log("mkdirp '" + tile_root + "'");
				
				if (! mkdirp.sync(tile_root)){
					return false;
				}
			}

			var fh = fs.openSync(tile_path, "w", 0o644);
					
			if (! fh){
				return;
			}

			fs.writeSync(fh, data)
			fs.close(fh);
		},

		'update': function(key, data){

			var tile_path = self.key_to_tile_path(key);

			if (! fs.exists(tile_path)){
				return;
			}
			
			var fh = fs.openSync(tile_path, "a", 0o644);
					
			if (! fh){
				return;
			}

			fs.writeSync(fh, data)
			fs.close(fh);			
		},

		'key_to_tile_path': function(key){

			var rel_path = key;
			
			var fname = path.basename(rel_path);			
			var root = path.dirname(rel_path);			
			
			var tile_root = path.join(tile_cache, root);
			var tile_path = path.join(tile_root, fname);			

			return tile_path;
		}
	};

	return self;
}));
