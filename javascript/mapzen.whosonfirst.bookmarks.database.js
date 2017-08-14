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

	// this pattern could probably use some finessing but works for now...
	// (20170731/thisisaaronland)
	
	const bookmarks = path.join(udata, "bookmarks.db");
	const exists = fs.existsSync(bookmarks);
	
	const db = new sqlite3.Database(bookmarks);

	var EXPORTING = 0;
	var BACKINGUP = 0;
	
	var self = {

		// this gets invoked in main.js
		
		'init': function(cb){

			console.log("[database][schema] INIT");
			
			if (exists){
				return self.process_alters(cb);
			}

			var app_path = app.getAppPath();
			var root = path.join(app_path, "schema");
			var schema = path.join(root, "main.sql");

			self.import_schema(schema, function(err){

				if (err){
					return cb(err);
				}

				return self.process_alters(cb);
			});
		},

		'import_schema': function(schema, cb){

			var fh = fs.openSync(schema, "r");

			if (! fh){
				console.log("[database][schema] ERR failed to load schema");
				console.log(e);				

				return cb("Failed to open schema file for reading");
			}

			try {
				var buf = fs.readFileSync(fh);
				var sql = buf.toString();
			}

			catch (e) {
				console.log("[database][schema] ERR failed to read schema");
				console.log(e);
				
				return cb(e);
			}

			console.log("[database][schema] IMPORT " + schema);
			
			db.exec(sql, function(e){

				if (e){
					console.log("[database][schema] ERR failed to load schema");
					console.log(e);
					return cb(e);
				}

				var dt = new Date;
				dt = dt.toISOString();

				var schema_name = path.basename(schema);
				
				var sql = "INSERT INTO db (schema, lastmodified) VALUES (?, ?)";
				var params = [ schema_name, dt ];

				// console.log(sql, params);
				
				db.run(sql, params, function(e){

					if (e){
						console.log("[database][schema] ERR failed to update 'db' table");
						console.log(e);
						return cb(e);
					}
					
					return cb(null);
				});
			});
			
		},

		'process_alters': function(cb){

			var sql = "SELECT schema, lastmodified FROM db";
			var params = [ ];

			db.all(sql, params, function(err, rows){

				if (err){
					console.log("[database][schema] ERR failed to query for previous alters");
					return cb(err);
				}
				
				var processed = {};

				var count_rows = rows.length;

				for (var i=0; i < count_rows; i++){
					var row = rows[i];
					processed[row["schema"]] = row["lastmodified"];
				}

				// console.log("[database][schema] PROCESSED", processed);
				
				var app_path = app.getAppPath();
				var root = path.join(app_path, "schema");
				var alters = path.join(root, "alters");

				fs.readdir(alters, function(err, files){

					// console.log("[database][schema] FILES", files);
					
					if (err){
						console.log("[database][schema] ERR failed to read " + alters, err);
						return cb(err);
					}

					var re_alter = /^(\d+)\.main\.sql$/;
					var to_process = [];
					
					var count_files = files.length;					
					
					for (var i=0; i < count_files; i++){
						
						var fname = files[i];
						var m = fname.match(re_alter);
						
						if (! m){
							continue;
						}

						if (processed[fname]){
							// console.log("[database][schema] SKIP", fname);
							continue;
						}
						
						var alter_path = path.join(alters, fname);
						to_process.push(alter_path);
					}

					var count_process = to_process.length;
					// console.log("[database][schema] PROCESS", count_process, to_process);
					
					if (! count_process){
						return cb();
					}				

					return self.process_alters_list(to_process, cb);
				});
			});

			return cb(null);
		},

		'process_alters_list': function(files, cb){

			self.import_schema(files[0], function(err){

				if (err){
					return cb(err);
				}

				if (files.length == 1){
					return cb();
				}

				var remaining = files.slice(1);
				return self.process_alters_list(remaining, cb);
			});
		},
				
		'conn': function(){
			return db;
		},

		'close': function(cb){
			db.close(cb);
		},

		'is_exporting': function(){
			return (EXPORTING > 0) ? true : false;
		},
		
		'export': function(cb){

			EXPORTING += 1;
			
			console.log("[database][export] BEGIN", EXPORTING);

			var sql = "SELECT name FROM sqlite_master WHERE type='table'";
			var params = [];

			db.all(sql, params, function(err, rows){

				if (err){
					console.log("[database][export] ERR", err);
					EXPORTING -= 1;
					return cb(err);
				}

				if (rows.length == 0){
					console.log("[database][export] ERR", "No tables to export");
					EXPORTING -= 1;					
					return cb(null);
				}
				
				// console.log("[database][export] TABLES", rows);

				try {
					self.export_tables(rows, cb);
				} catch(e) {
					console.log("[database][export] ERR", e);					
				}

				EXPORTING -= 1;
			});
		},

		'export_tables': function(rows, cb){
			
			EXPORTING += 1;
			
			var row = rows[0];
			var table = row["name"];

			console.log("[database][export_tables] TABLE", table, EXPORTING);

			var re_table = /^(places|lists|visits|tags|trips).*?/;
			
			if (! table.match(re_table)){
				
				console.log("[database][export_tables] SKIP", table);
				EXPORTING -= 1;
				
				if (rows.length > 1){
					
					console.log("[database][export_tables] NEXT table", rows.length);
					
					rows = rows.slice(1);
					return self.export_tables(rows, cb);
				}

				return cb();
			}
			
			var fname = "bookmarks-" + table + ".csv";
			var export_path = path.join(udata, fname);

			console.log("[database][export_tables] EXPORT", table, export_path);

			var sql = "SELECT * FROM " + table;	// PLEASE ESCAPE ME OR SOMETHING...
			var params = [];

			console.log("[database][export_tables] QUERY", sql, params);
			
			db.all(sql, params, function(err, trows){

				console.log("[database][export_tables] RESULTS", table, trows.length);
				
				if (err){
					console.log("[database][export_tables] ERR fetching rows for " + table);
					EXPORTING -= 1;

					return cb(err);
				}

				if (trows.length < 1){
					console.log("[database][export_tables] SKIP", table, "no rows");
					EXPORTING -= 1;
					
					rows = rows.slice(1);
					return self.export_tables(rows, cb);
				}

				var first = trows[0];
				var headers = [];

				for (k in first){
					headers.push(k);
				}

				var fh = fs.createWriteStream(export_path);
				
				if (! fh){
					EXPORTING -= 1;
					console.log("[database][export] ERR failed to load open " + export_path + " for writing");
					return cb("Failed to open CSV file for writing");
				}
				
				var csvWriter = require('csv-write-stream');
				var writer = csvWriter({"headers": headers});
				writer.pipe(fh);			
				
				var count_trows = trows.length;

				for (var t=0; t < count_trows; t++){
					writer.write(trows[t]);
				}

				writer.end();
				
				console.log("[database][export] CSV complete", table, rows.length);
				EXPORTING -= 1;
				
				if (rows.length > 1){
					console.log("[database][export] NEXT");					
					rows = rows.slice(1);
					return self.export_tables(rows, cb);
				}

				return cb();
			});
		},
		
		'backup': function(cb){

			var backup = bookmarks + ".bak";
			
			var rd = fs.createReadStream(bookmarks);
			
			rd.on("error", function(err){
				cb(err, null);
			});

			var wr = fs.createWriteStream(backup);
			
			wr.on("error", function(err) {
				cb(err, null);
			});

			wr.on("close", function(){
				cb(null, backup);
			});
			
			rd.pipe(wr);
		},
		
		// TO DO - replace and remove all of these functions...
		
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
	};

	return self;
}));
