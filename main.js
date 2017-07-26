const electron = require('electron')

const app = electron.app
const BrowserWindow = electron.BrowserWindow
const Menu = electron.Menu

const settings = require('electron-settings');

const ipcMain = require('electron').ipcMain;

const path = require('path')
const url = require('url')

let mainWindow
let settingsWindow

function createMainWindow () {

	mainWindow = new BrowserWindow({width: 1024, height: 800})
	
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file:',
		slashes: true
	}))

	// mainWindow.webContents.openDevTools();
	
	mainWindow.on('closed', function (){
		mainWindow = null
	});
	
	mainWindow.webContents.once("did-finish-load", function (){

		// sudo put me not-in-main.js...
		
		const http = require("http");
		const https = require("https");
		
		const crypto = require("crypto");
		const u = require("url");

		const mkdirp = require('mkdirp');
		const path = require('path');
		const fs = require('fs');

		const udata = app.getPath("userData");
		const tile_cache = path.join(udata, "tiles");
		
		if (! fs.existsSync(tile_cache)){

			if (! fs.mkdirSync(tile_cache)){
				console.log("ARGH - can not create '" + tile_cache + "'");
				return false;
			}
		}

		// sudo fix me to generate TLS-stuff at start-up and
		// use https.createServer...
		
		var server = http.createServer();
		
		// https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/
		
		server.on("request", function (req, res){

			// https://tile.mapzen.com/mapzen/vector/v1/all/15/9685/11719.topojson?api_key=mapzen-xxxxx
			// https://nodejs.org/api/http.html#http_class_http_incomingmessage
			
			const { method, url } = req;
			var p = u.parse(url, true);	// true as in "tease out query parameters"

			var rel_path = p.pathname;
			var fname = path.basename(rel_path);			
			var root = path.dirname(rel_path);			

			var tile_root = path.join(tile_cache, root);
			var tile_path = path.join(tile_root, fname);			

			// console.log(tile_path);

			if (fs.existsSync(tile_path)){
				
				// console.log("return cache tile here");
				// my kingdom for 'sendfile' here...
				
				var fh = fs.openSync(tile_path, "r");

				if (! fh){
					res.writeHead(500);
					res.end();
					return;
				}

				var body = fs.readFileSync(fh);

				if (! body){
					res.writeHead(500);
					res.end();
					return;
				}
				
				res.writeHead(200);	// TO DO: headers?
				res.write(body);
				res.end();
				return;
			}
			
			if (! fs.existsSync(tile_root)){

				// console.log("mkdirp '" + tile_root + "'");
				
				if (! mkdirp.sync(tile_root)){
					res.writeHead(500);
					res.end();
					return;
				}
			}

			var mz_url = "https://tile.mapzen.com" + url;
			// console.log("fetch " + mz_url);
			
			https.get(mz_url , function(mz_rsp){

				mz_rsp.setEncoding('utf8');
				
				var mz_status = mz_rsp.statusCode;
				var mz_headers = mz_rsp.headers;
				var mz_body = null;

				if (mz_status != 200){
					res.writeHead(mz_status, mz_headers);
					res.end();
					return;
				}

				var fh = fs.openSync(tile_path, "w", 0o644);

				if (! fh){
					res.writeHead(500);
					res.end();
					return;
				}
				
				res.writeHead(mz_status, mz_headers);				
				
				mz_rsp.on('data', function (data){
					// console.log("DATA");
					res.write(data);
					fs.writeSync(fh, data);
				});

				mz_rsp.on('end', function(){
					// console.log("END");
					res.end();
					fs.close(fh);
				});
				
			});
		});

		console.log("hi");
		server.listen(9229);
	});
}

function createSettingsWindow () {

	if (settingsWindow){
		settingsWindow.show();
		return;
	}
	
	settingsWindow = new BrowserWindow({width: 1024, height: 800})
	
	settingsWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'settings.html'),
		protocol: 'file:',
		slashes: true
	}))

	settingsWindow.on('closed', function (){
		settingsWindow = null
	});
}

app.on('ready', function(){

	createMainWindow();

	// https://pracucci.com/atom-electron-enable-copy-and-paste.html

	var name = app.getName();

	var about = "About " + name;
	var hide = "Hide " + name;
	var quit = "Quit " + name;
	
	var template = [
		{
			label: "Application",
			submenu: [
				{ label: about, selector: "orderFrontStandardAboutPanel:" },
				{ type: "separator" },
				{ label: hide, accelerator: "Command+H", click: function() { app.hide(); }},			
				{ label: quit, accelerator: "Command+Q", click: function() { app.quit(); }}
			]
		},
		{
			label: "Edit",
			submenu: [
				{ label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
				{ label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
				{ type: "separator" },
				{ label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
				{ label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
				{ label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
				{ label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
			]
		},
		{
			label: "Mapzen",
			submenu: [
				{ label: "Settings", accelerator: "Ctrl+M", click: function() { createSettingsWindow();	}},
			]
		},
		{
			label: "Developer",
			submenu: [
				{ label: "Developer Console", accelerator: "Command+D", click: function(){
					var win = BrowserWindow.getFocusedWindow();
					if (win){ win.webContents.openDevTools(); }}
				}
			]
		}
	];
	
	Menu.setApplicationMenu(Menu.buildFromTemplate(template));
});

app.on('window-all-closed', function (){
	
	if (process.platform !== 'darwin'){
		app.quit();
	}
})

app.on('activate', function (){
	
	if (mainWindow === null){
		createMainWindow();
	}
})

ipcMain.on('renderer', (event, arg) => {

	if (arg == "settings"){
		createSettingsWindow();
		return;
	}
})
