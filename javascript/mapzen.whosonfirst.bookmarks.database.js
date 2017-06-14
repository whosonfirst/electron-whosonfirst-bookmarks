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

		var visits_sql = `CREATE TABLE visits (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
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

		var places_sql = `CREATE TABLE places (
			wof_id INTEGER,
			body TEXT,
			created TEXT
		)`;

		db.exec(visits_sql, function(e){

			if (e){
				console.log("OH NO VISITS");
				console.log(e);				
			}			
		});

		db.exec(places_sql, function(e){

			if (e){
				console.log("OH NO PLACES");
				console.log(e);				
			}			
		});
				
	}

	var self = {

		'add_visit': function(pl, status_id, cb){

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

			var sql = "INSERT INTO visits (wof_id, latitude, longitude, neighbourhood_id, locality_id, region_id, country_id, status_id, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
			
			var params = [wof_id, lat, lon, neighbourhood_id, locality_id, region_id, country_id, status_id, dt];

			db.run(sql, params, cb);
		},

		'remove_visit': function(visit_id, cb){

			var sql = "DELETE FROM visits WHERE id = ?";
			var params = [ visit_id ];

			db.run(sql, params, cb);
		},
		
		'get_visits_for_place': function(wof_id, cb){

			var sql = "SELECT * FROM visits WHERE wof_id = ? ORDER BY date DESC";
			var params = [ wof_id ];

			db.all(sql, params, cb);
		},
	}

	return self;
}));
