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

		'init': function(){

			var wg = self.waitgroup();
			wg.add(1);
			
			new mbtiles(tile_cache, function(err, conn){
				
				if (err){
					console.log("[cache][mbtiles] ERR failed to create database connection");
				}

				else {
					dbconn = conn;
				}
				
				wg.done();
			});

			var cb = function(){
				
				if (! dbconn){
					return false;
				}
				
				console.log("[cache][mbtiles] CONN database connection successful");
				return true;
			};

			wg.wait(cb);

			return true;	// THIS IS A BUG because the waitgroup stuff doesn't work correctly...
		},

		'get': function(key){

			console.log("[cache][mbtiles] GET cache for '" + key + "'");
			
			var zxy = self.key_to_zxy(key);

			if (! zxy){
				return false;
			}

			var wg = self.waitgroup();
			wg.add(1);

			var data;
			
			dbconn.getTile(zxy.Z, zxy.X, zxy.Y, function(err, buf, headers){

				if (err){
					console.log("[cache][mbtiles] ERR failed to get cache for '" + key + "'");
					console.log(err);
				}

				else {
					// do something with headers here...
					// console.log(headers);

					try {
						data = JSON.parse(buf.toString());
					}

					catch (e){
						console.log("[cache][mbtiles] ERR failed to parse cache for '" + key + "'");
						console.log(err);
					}
				}
				
				wg.done();
			});

			var cb = function(){
				console.log("[cache][mbtiles] GET complete for '" + key + "'");
				return data;
			};

			console.log("GET WAIT... for " + key);
			wg.wait(cb);

			console.log("GET RETURN... for " + key);			
			console.log("GET RETURN... with " + data);			
		},

		'set': function(key, data){

			console.log("[cache][mbtiles] SET cache for '" + key + "'");
			
			var zxy = self.key_to_zxy(key);

			if (! zxy){
				return false;
			}

			var wg = self.waitgroup();
			wg.add(1);

			var buf = new buffer.Buffer.from(JSON.stringify(data));

			dbconn.startWriting(function(err){

				// console.log("[cache][mbtiles] START writing");
				
				if (err){
					console.log("[cache][mbtiles] ERR failed to configure database for writing");
					console.log(err);
					
					wg.done();
					return false;
				}

				dbconn.putTile(zxy.Z, zxy.X, zxy.Y, buf, function(err, rsp){

					// console.log("[cache][mbtiles] PUT tile");
					
					if (err){
						console.log("[cache][mbtiles] ERR failed to set cache for '" + key + "'");
						console.log(err);

						wg.done();
						return false;
					}

					dbconn.stopWriting(function(err){

						// console.log("[cache][mbtiles] STOP writing");

						if (err){
							console.log("[cache][mbtiles] ERR failed to commit database writes");
							console.log(err);
						}
						
						wg.done();
						return false;
					});
					
					wg.done();
				});
			});

			var cb = function(){
				console.log("[cache][mbtiles] SET complete for '" + key + "'");
			};
			
			wg.wait(cb);
		},

		'key_to_zxy': function(key){

			// /mapzen/vector/v1/all/15/9685/11719.topojson

			var m = key.match(/.*\/(\d+)\/(\d+)\/(\d+)\..*$/);

			if (! m){
				console.log("[cache][mbtiles] ERR failed to parse key '" + key + "'");
				return ;
			}
			
			var z = parseInt(m[1]);
			var x = parseInt(m[2]);
			var y = parseInt(m[3]);

			console.log("[cache][mbtiles] KEY '" + key + "' becomes Z: (" + z + ") X: (" + x + ") Y: (" + y + ")");
			return { Z: z, X: x, Y: y };
		},

		'waitgroup': function(){
			var wg = require("./mapzen.whosonfirst.waitgroup.js");
			return wg;
		}
	};

	return self;
}));
