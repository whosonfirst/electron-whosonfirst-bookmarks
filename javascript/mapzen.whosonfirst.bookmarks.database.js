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

	console.log(bookmarks);
	
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
