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
	const fsex = require('fs-extra');	

	const app = electron.app || electron.remote.app;
	const udata = app.getPath("userData");
	
	var self = {

		'path': function(wof_id){

			var fname = wof_id + ".png";
			var froot = self.id2root(wof_id);
			
			froot = path.join("places", froot);
			froot = path.join(udata, froot);

			var fpath = path.join(froot, fname);
			return fpath;
		},

		'exists': function(wof_id){

			var fpath = self.path(wof_id);
			return fs.existsSync(fpath);
		},

		'data_url': function(wof_id){

			var fpath = self.path(wof_id);
			var bitmap = fs.readFileSync(fpath);
			
			var buf = new Buffer(bitmap);
			var b64 = buf.toString('base64');

			return "data:image/png;base64," + b64;
		},
		
		'save': function(rsp, wof_id){

			var fpath = self.path(wof_id);
			var froot = path.dirname(fpath);
			
			if (! fs.existsSync(froot)){
				fsex.ensureDirSync(froot);
			}
			
			var fileReader = new FileReader();
			
			fileReader.onload = function (){
				fs.writeFileSync(fpath, Buffer(new Uint8Array(this.result)));
			};
			
			fileReader.readAsArrayBuffer(rsp.blob);
			console.log("SAVE SCREENSHOT AS " + fpath);
		},

		'id2root': function(id){

			str_id = new String(id);
			tmp = new Array();
			
			while (str_id.length){
				var part = str_id.substr(0, 3);
				tmp.push(part);
				str_id = str_id.substr(3);
			}
			
			var root = tmp.join("/");
			return root;
		},
		
	};

	return self;

}));
