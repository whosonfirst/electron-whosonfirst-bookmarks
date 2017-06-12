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

	const sqlite3 = require('sqlite3').verbose();
	
	const app = electron.app || electron.remote.app;
	const udata = app.getPath("userData");

	const bookmarks = path.join(udata, "bookmarks.db");
	const db = new sqlite3.Database(bookmarks);
	
	if (! fs.existsSync(bookmarks)){

		console.log("CREATE DATABASE");
	}

	var self = {
		
	}

	return self;
}));
