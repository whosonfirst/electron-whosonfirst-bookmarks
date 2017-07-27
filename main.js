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

		const cache = require("./javascript/mapzen.whosonfirst.tiles.cache.fs.js");
		const proxy = require("./javascript/mapzen.whosonfirst.tiles.proxy.js");

		const server = proxy.server(cache);
		
		if (server){
			server.listen(9229);
		}
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
