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

		var tiles_endpoint = 'https://tile.mapzen.com';

		var proxy_host = "http://localhost";
		var proxy_port = 9229;

		var proxy_endpoint = proxy_host + ":" + proxy_port;

		// this is the actual proxy server and caching logic for handling tiles
		// stuff - we handle intercepting requests below
		
		const cache = require("./javascript/mapzen.whosonfirst.tiles.cache.fs.js");
		const proxy = require("./javascript/mapzen.whosonfirst.tiles.proxy.js");

		const server = proxy.server(cache);
		
		if (! server){
			console.log("[proxy] FAIL unable to create proxy server");
			return false;
		}

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
		
		const {session} = require('electron')
		
		var tiles_match = tiles_endpoint + '/*';		
		var proxy_match = proxy_endpoint + '/*';

		const tiles_filter = {
			urls: [ tiles_match,]
		}

		const proxy_filter = {
			urls: [ proxy_match,]
		}

		// FYI - cached requests/URLs never even make it this far
		
		session.defaultSession.webRequest.onBeforeRequest(tiles_filter, (details, callback) => {

			if (! server.listening){
				console.log("[proxy] SKIP server not listening");
				callback({});
				return;
			}
			
			var req_url = details["url"];
			var redir_url = req_url.replace(tiles_endpoint, proxy_endpoint);
			
			console.log("[proxy] REDIRECT from " + tiles_endpoint + " TO " + proxy_endpoint);
			
			callback({
				'cancel': false,
				'redirectURL': redir_url
			});
		});


		session.defaultSession.webRequest.onErrorOccurred(proxy_filter, (details, callback) => {

			var err = details["error"];

			console.log("[proxy] ERR stop listening because " + err);
			server.close();

			// TO DO: issue redirect here? how... ?
		});
		
		server.listen(proxy_port);		
		return true;
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
