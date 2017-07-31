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

	const fb = require("./mapzen.whosonfirst.bookmarks.feedback.js");	

	const electron = require('electron');
	const path = require('path');
	const fs = require('fs');

	// https://github.com/mapbox/node-sqlite3/wiki/API
	// https://sqlite.org/lang.html
	
	const sqlite3 = require('sqlite3').verbose();
	
	const app = electron.app || electron.remote.app;
	const udata = app.getPath("userData");

	const bookmarks = path.join(udata, "bookmarks.db");
	const db = new sqlite3.Database(bookmarks);

	var self = {

		'init': function(cb){

			console.log("[database][schema] INIT");
			
			var debug = path.join(udata, "bookmarks-debug.db");
			var exists = fs.existsSync(debug);
			
			const db2 = new sqlite3.Database(debug);

			if (exists){
				console.log("[database][schema] SKIP");				
				return cb(null);
			}
			
			var app_path = app.getAppPath();
			var root = path.join(app_path, "schema");
			var schema = path.join(root, "main.sql");

			var fh = fs.openSync(schema, "r");

			if (! fh){
				return cb("Failed to open schema file for reading");
			}

			try {
				var buf = fs.readFileSync(fh);
				var sql = buf.toString();
			}

			catch (e) {
				console.log("[database][schema] ERR failed to setup");
				console.log(e);				
				return cb(e);
			}
			
			db2.exec(sql, function(e){

				if (e){
					console.log("[database][schema] ERR failed to setup");
					console.log(e);
					return cb(e);
				}

				console.log("[database][schema] SETUP complete");
				return cb(null);
			});
		},
		
		'conn': function(){
			return db;
		},
		
		'add_place': function(pl){

		},
		
		'get_visits': function(cb){

			var sql = "SELECT * FROM visits ORDER BY date DESC";
			var params = [];

			db.all(sql, params, cb);			
		},
		
		'get_visits_for_place': function(wof_id, cb){

			var sql = "SELECT * FROM visits WHERE wof_id = ? ORDER BY date DESC";
			var params = [ wof_id ];

			db.all(sql, params, cb);
		},

		'get_visit_count_for_place': function(wof_id ,cb){

			var sql = "SELECT COUNT(id) AS count_visits FROM visits WHERE wof_id = ?";
			var params = [ wof_id ];

			db.get(sql, params, function(err, row){

				if (! err){
					row["wof_id"] = wof_id;
				}
				
				cb(err, row);
			});
		},

		'get_cities_list': function(cb){

			var sql = "SELECT locality_id, COUNT(id) AS count_visits FROM visits GROUP BY locality_id ORDER BY count_visits DESC";
			var params = [];

			db.all(sql, params, cb);
		}
	}

	return self;
}));
