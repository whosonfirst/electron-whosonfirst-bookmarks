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
	const buffer = require('buffer');
	
	const udata = app.getPath("userData");
	const tile_cache = path.join(udata, "tiles.db");

	// https://github.com/mapbox/node-mbtiles/blob/master/lib/mbtiles.js	
	const mbtiles = require('@mapbox/mbtiles');

	var dbconn;
	
	var self = {

		'init': function(cb){

			new mbtiles(tile_cache, function(err, conn){
				
				if (err){
					console.log("[cache][mbtiles] ERR failed to create database connection");
					return cb(err);
				}

				dbconn = conn;
				return cb(null);
			});
		},

		'get': function(key, cb){

			console.log("[cache][mbtiles] GET cache for '" + key + "'");
			
			var zxy = self.key_to_zxy(key);

			if (! zxy){
				return cb("Failed to parse key", null);
			}

			var data;
			
			dbconn.getTile(zxy.Z, zxy.X, zxy.Y, function(err, buf, headers){

				if (err){
					console.log("[cache][mbtiles] ERR failed to get cache for '" + key + "'");
					return cb(err, null);
				}

				else {
					// do something with headers here...
					// console.log(headers);

					try {
						data = JSON.parse(buf.toString());
					}

					catch (e){
						console.log("[cache][mbtiles] ERR failed to parse cache for '" + key + "'");
						return cb(err, null);
					}
				}

				return cb(null, data);
			});
		},

		'set': function(key, data, cb){

			console.log("[cache][mbtiles] SET cache for '" + key + "'");
			
			var zxy = self.key_to_zxy(key);

			if (! zxy){
				return cb("Failed to parse key");
			}

			var buf = new buffer.Buffer.from(JSON.stringify(data));

			dbconn.startWriting(function(err){

				// console.log("[cache][mbtiles] START writing");
				
				if (err){
					console.log("[cache][mbtiles] ERR failed to configure database for writing");
					return cb(err);
				}

				dbconn.putTile(zxy.Z, zxy.X, zxy.Y, buf, function(err, rsp){

					// console.log("[cache][mbtiles] PUT tile");
					
					if (err){
						console.log("[cache][mbtiles] ERR failed to set cache for '" + key + "'");
						return cb(err);
					}

					dbconn.stopWriting(function(err){

						// console.log("[cache][mbtiles] STOP writing");

						if (err){
							console.log("[cache][mbtiles] ERR failed to commit database writes");
							return cb(err);
						}

						return cb(null);
					});
				});
			});
		},

		'key_to_zxy': function(key){

			// /mapzen/vector/v1/all/15/9685/11719.topojson

			var m = key.match(/.*\/(\d+)\/(\d+)\/(\d+)\..*$/);

			if (! m){
				console.log("[cache][mbtiles] ERR failed to parse key '" + key + "'");
				return null;
			}
			
			var z = parseInt(m[1]);
			var x = parseInt(m[2]);
			var y = parseInt(m[3]);

			console.log("[cache][mbtiles] KEY '" + key + "' becomes Z: (" + z + ") X: (" + x + ") Y: (" + y + ")");
			return { Z: z, X: x, Y: y };
		}
	};

	return self;
}));
