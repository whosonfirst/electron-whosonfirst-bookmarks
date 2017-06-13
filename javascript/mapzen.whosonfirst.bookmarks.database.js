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
	const path = require('path');
	const fs = require('fs');

	// https://github.com/mapbox/node-sqlite3/wiki/API
	// https://sqlite.org/lang.html
	
	const sqlite3 = require('sqlite3').verbose();
	
	const app = electron.app || electron.remote.app;
	const udata = app.getPath("userData");

	const bookmarks = path.join(udata, "bookmarks.db");
	const exists = fs.existsSync(bookmarks);
	
	const db = new sqlite3.Database(bookmarks);
	
	if (! exists){

		var sql = `CREATE TABLE places (
			id INTEGER AUTO INCREMENT,
			latitude NUMERIC,
			longitude NUMERIC,
			wof_id INTEGER,
			neighbourhood_id INTEGER,
			locality_id INTEGER,
			region_id INTEGER,
			country_id INTEGER,
			status_id INTEGER,
			date TEXT
		)`;

		db.exec(sql, function(e){

			if (e){
				console.log("OH NO");
				console.log(e);				
			}			
		});
	}

	var self = {

		'add_place': function(pl, status_id){

			var wof_id = pl['wof:id'];
			var lat = pl['geom:latitude'];
			var lon = pl['geom:longitude'];			

			var hier = pl['wof:hierarchy'];
			hier = hier[0];				// PLEASE FIX ME

			var neighbourhood_id = hier['neighbourhood_id'];
			var locality_id = hier['locality_id'];
			var region_id = hier['region_id'];
			var country_id = hier['country_id'];			

			var dt = new Date;
			dt = dt.toISOString();

			var sql = "INSERT INTO places (wof_id, latitude, longitude, neighbourhood_id, locality_id, region_id, country_id, status_id, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
			
			var params = [wof_id, lat, lon, neighbourhood_id, locality_id, region_id, country_id, status_id, dt];

			db.run(sql, params, function(e){

				console.log("CB");
				console.log(e);
			});
		}
	}

	return self;
}));
