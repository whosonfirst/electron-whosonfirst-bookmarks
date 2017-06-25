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

		'save': function(rsp){

			var fname = screenshot_id + "." + rsp.type;
			var froot = udata;
					
			if (screenshot_root){
				froot = path.join(udata, screenshot_root);
			}
			
			if (! fs.existsSync(froot)){
				fsex.ensureDirSync(froot);
			}
			
			var fpath = path.join(froot, fname);
			// console.log("SAVE " + fpath);
			
			var fileReader = new FileReader();
			
			fileReader.onload = function (){
				fs.writeFileSync(fpath, Buffer(new Uint8Array(this.result)));
			};
			
			fileReader.readAsArrayBuffer(rsp.blob);
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
