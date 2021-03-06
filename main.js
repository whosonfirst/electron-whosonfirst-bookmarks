const electron = require('electron')

const app = electron.app
const BrowserWindow = electron.BrowserWindow
const Menu = electron.Menu

const settings = require('electron-settings');

const ipcMain = require('electron').ipcMain;

const path = require('path')
const url = require('url')

const db = require("./javascript/mapzen.whosonfirst.bookmarks.database.js");

let mainWindow
let settingsWindow

const isSecondInstance = app.makeSingleInstance((commandLine, workingDirectory) => {

	if (mainWindow) {
		
		if (mainWindow.isMinimized()){
			mainWindow.restore();
		}
		
		mainWindow.focus();
	}
});

if (isSecondInstance) {
	console.log("[app] ALREADY RUNNING");
	app.quit();
}

function createMainWindow () {

	if (isSecondInstance) {
		return;
	}
	
	db.init(function(err){
		
		if (err){
			const {dialog} = require('electron')
			dialog.showErrorBox("Error", "Database setup failed. That's not right...");
			app.quit();
		}
	});
	
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
		
		var tiles_endpoint = 'https://tile.mapzen.com';

		var proxy_host = "localhost";
		var proxy_port = 9229;

		var proxy_endpoint = "http://" + proxy_host + ":" + proxy_port;

		// because we'll need `server` outside of cache.init
		var server;
		
		const cache = require("./javascript/mapzen.whosonfirst.tiles.cache.mbtiles.js");
		// const cache = require("./javascript/mapzen.whosonfirst.tiles.cache.fs.js");

		cache.init(function(err){

			if (err){
				console.log("[proxy] FAIL cache initialization failed");
				return false;
			}
			
			const proxy = require("./javascript/mapzen.whosonfirst.tiles.proxy.js");
			server = proxy.server(cache);
		
			if (! server){
				console.log("[proxy] FAIL unable to create proxy server");
				return false;
			}
			
			try {
				server.listen(proxy_port, proxy_host);
			}
			
			catch (e) {
				console.log("[proxy] FAIL unable to start proxy server, because " + e);
				return false;
			}

			return true;
		});

		// https://electron.atom.io/docs/api/web-request/
		
		// this is where we are intercepting requests (rather than say rewriting
		// the source url for tiles in mapzen/tangram.js) - in a different universe
		// we could put all the caching logic here but the electron web-request
		// stuff doesn't actually give you access to body of a response so... there
		// is literally nothing to cache. in addition to pre-filtering requests to
		// tile.mapzen we are post-filtering on the proxy server to check for errors
		// at which point we _stop_ the proxy server causing the pre-filter to no
		// longer issue redirects. unfortunately if we encounter a proxy error there
		// is no way to issue a redirect (to the default tiles endpoint)
		
		const {session} = require('electron');
		
		var tiles_match = tiles_endpoint + '/*';		
		var proxy_match = proxy_endpoint + '/*';
		
		const tiles_filter = {
			urls: [ tiles_match ]
		}
		
		const proxy_filter = {
			urls: [ proxy_match ]
		}
		
		var all_filter = {
			urls: [ '*' ]
		};
		
		// FYI - cached requests/URLs never even make it this far
		
		session.defaultSession.webRequest.onBeforeRequest(all_filter, (details, callback) => {
			
			var req_url = details["url"];
			console.log("[filter] REQUEST " + req_url);
			
			// because the mapzen styleguide...
			
			if (req_url.match(/^https?\:\/\/fonts\.gstatic\.com/)){
				console.log("[filter] BLOCK " + req_url);
				return callback({cancel: true});
			}

			else if (req_url.match(/^https?\:\/\/fonts\.googleapis\.com/)){
				console.log("[filter] BLOCK " + req_url);
				return callback({cancel: true});
			}

			else if (req_url.match(/^https?\:\/\/maxcdn\.bootstrapcdn\.com/)){
				console.log("[filter] BLOCK " + req_url);
				return callback({cancel: true});
			}
			
			else if (req_url.match(/https\:\/\/tile\.mapzen\.com/)){
				
				if ((! server) || (! server.listening)){
					console.log("[fitler] SKIP proxy server not listening");
					return callback({});
					return;
				}
				
				var redir_url = req_url.replace(tiles_endpoint, proxy_endpoint);
				
				// console.log("[filter] REDIRECT " + tiles_endpoint + " TO " + proxy_endpoint);

				return callback({'redirectURL': redir_url});
			}
			
			else {
				return callback({});
			}
		});
		
		// maybe don't shut down the proxy server on the first error but track (n)
		// errors over (y) seconds?
		
		session.defaultSession.webRequest.onErrorOccurred(proxy_filter, (details) => {
			
			var url = details["url"];				
			var err = details["error"];
			
			console.log("[filter] ERROR proxying " + url +", because " + err);
			
			// console.log("[proxy] ERR stop listening because " + err);
			// server.close();
		});
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

	console.log("[app][window-all-closed] CLOSE");
	if (process.platform !== 'darwin'){
		app.quit();
	}
})

app.on('activate', function (){
	
	if (mainWindow === null){		
		createMainWindow();
	}
});

app.on('quit', function(){
	console.log("[app][quit] EXIT");
});

app.on('before-quit', function(event){

	console.log("[app][before-quit] START");

	var wait = function(){

		// console.log("[app][before-quit] EXPORTING", db.is_exporting());

		if (db.is_exporting()){
			setTimeout(wait, 10);
			return;
		}

		// console.log("[app][before-quit] BACKING UP", db.is_backingup());

		if (db.is_backingup()){
			setTimeout(wait, 10);
			return;
		}

		process.exit(0);
	};
	
	try {
		db.export(function(err, path){
		
			if (err){
				console.log("[app][before-quit] ERR backing up database");
			}

			console.log("[app][before-quit] CLOSE database");
			
			db.close(function(err){
				
				if (err){
					console.log("[app][before-quit] ERR closing database");
					waiting = false;
					return;
				}

				console.log("[app][before-quit] BACKUP database");
				
				db.backup(function(err, path){

					if (err){
						console.log("[app][before-quit] ERR backing up database");
						return;				
					}	
					
					console.log("[app][before-quit] OK database backup created at " + path);
					return;
					
				});	// db.backup
			}); 		// db.close
		}); 			// db.export

		wait();
		
	} catch (e) {
		console.log("[app][before-quit] SNFU", e);
		process.exit(1);
	}

	event.preventDefault();		
});

ipcMain.on('renderer', (event, arg) => {

	if (arg == "settings"){
		createSettingsWindow();
		return;
	}
});
