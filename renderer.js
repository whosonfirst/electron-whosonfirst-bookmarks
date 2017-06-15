const ipcRenderer = require('electron').ipcRenderer;
const electron = require('electron');

// sqlite

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');

// settings
// var show_s = document.getElementById("show-settings");
// show_s.onclick = function(){ ipcRenderer.send('renderer', 'settings'); };

const settings = require('electron').remote.require('electron-settings');

settings.watch("current", function(e){
	set_current_config();
});

window.addEventListener("load", function load(event){
	set_current_config();
});

function get_config(){
	
	// first just get all the possible configs and
	// sort them alphabetically - this is in case
	// we can't find the "current" config or one
	// hasn't been set yet
	
	var configs = settings.get("configs");
	var possible = [];
	
	for (name in configs){
		possible.push(name);
	}
	
	possible.sort();
	
	// first try getting the current setting - if
	// it's not set then use first of any possible
	// configs
	
	var name = settings.get("current");
	
	if ((! name) && (possible.length == 0)){
		return null;
	}
	
	if (! name){
		name = possible[0];
	}
	
	// actually try to _get_ the config that maps
	// to the value of 'current'
	
	var path = [ "configs", name ];
	path = path.join(".");
	
	var config = settings.get(path);
	
	// if there isn't one, try again why the first
	// possible - maybe repeat this with all the
	// possible configs?
	
	if (! config){
		
		name = possible[0];
		
		path = [ "configs", name ];
		path = path.join(".");
		
		config = settings.get(path);
	}
	
	if (! config){
		return null;
	}
	
	// okay!
	
	config['name'] = name;
	
	settings.set("current", name);
	return config;
}

function set_current_config(){

	var el = document.getElementById("show-settings");
	var config = get_config();

	if (config){
				
		var key = config.api_key;
		var ep = config.endpoint;
		
		// el.setAttribute("data-config-name", config.name);
		// remove_class(el, "warning");

		document.body.setAttribute("data-api-endpoint", ep);
		document.body.setAttribute("data-api-key", key);		
	}

	else {
		
		// el.setAttribute("data-config-name", "");					
		// append_class(el, "warning");

		document.body.removeAttribute("data-api-endpoint");
		document.body.removeAttribute("data-api-key");				
	}
	
}
