const settings = require('electron').remote.require('electron-settings');

function get_configs(){

	var configs = settings.get("configs");

	if (! configs){
		configs = {};
	}

	return configs;
}

function set_named_config(name, config){

	var configs = get_configs();
	configs[name] = config;

	// https://github.com/nathanbuchar/electron-settings/wiki/API-documentation#set
	
	for (k in config) {

		var path = [ "configs", name, k ];
		path = path.join(".");

		settings.set(path, config[k]);
	}
}

function get_named_config(name){
	
	var path = [ "configs", name ];
	path = path.join(".");
	
	return settings.get(path);
}

function remove_named_config(name){

	var path = [ "configs", name ];
	path = path.join(".");
	
	settings.delete(path);
}

function save_settings(){

	var api_key = document.getElementById("api_key");
	api_key = api_key.value;
	
	var endpoint = document.getElementById("endpoint");
	endpoint = endpoint.value;
	
	var name = document.getElementById("name");
	name = name.value;

	api_key = api_key.trim();
	endpoint = endpoint.trim();
	name = name.trim();

	if (api_key == ""){
		alert("API key can not be empty.");
		return false;
	}
	
	if (endpoint == ""){
		alert("API endpoint can not be empty.");
		return false;
	}

	if (name == ""){
		alert("Name can not be empty.");
		return false;
	}
	
	// PLEASE VALIDATE ME HERE...
	
	var config = {
		"api_key": api_key,
		"endpoint": endpoint
	};

	set_named_config(name, config);

	settings.set("current", name);
	
	reload_settings();
	return false;
}

function delete_settings(){

	var name = document.getElementById("name");
	name = name.value;

	var msg = "Are you sure you want to remove the API settings named '" + name + "' ?";
	
	if (! confirm(msg)){
		return false;
	}

	remove_named_config(name);

	settings.set("current", null);
	reload_settings();
}

function load_settings(name){

	var config = get_named_config(name);

	if (! config){
		new_settings();
		return;
	}
	
	var name_el = document.getElementById("name");
	name_el.setAttribute("disabled", "disabled");
	name_el.value = name;
	
	var endpoint_el = document.getElementById("endpoint");
	endpoint_el.value = config.endpoint;
	
	var key_el = document.getElementById("api_key");		
	key_el.value = config.api_key;	

	var delete_button = document.getElementById("settings-remove");
	delete_button.style.display = "inline";
	
	delete_button.onclick = delete_settings;
}

function new_settings(){

	var name_el = document.getElementById("name");
	name_el.removeAttribute("disabled");
	name_el.value = "";
	
	// var endpoint_el = document.getElementById("endpoint");
	// endpoint_el.value = "https://whosonfirst-api.mapzen.com";
	
	var key_el = document.getElementById("api_key");
	key_el.value = "";
}

function reload_settings(){

	var configs = get_configs();
	var config_names = [];

	for (name in configs){
		config_names.push(name);
	}

	config_names.sort();
	var count = config_names.length;
	
	var current_config = settings.get("current");	

	var select = document.getElementById("settings-select");
	select.innerHTML = "";

	var selected = null;
	
	if (count) {

		for (var i=0; i < count; i++){

			var name = config_names[i];

			var option = document.createElement("option");
			option.setAttribute("value", name);
			option.appendChild(document.createTextNode(name));

			if (name == current_config){

				if (selected){
					selected.removeAttribute("selected");
				}
				
				option.setAttribute("selected", "selected");
				selected = option;
			}
						
			select.appendChild(option);
			select.onchange = function(e){
				
				var el = e.target;
				var name = el.options[el.selectedIndex].value;
				
				if (name == -1){
					new_settings();
					return;
				}

				settings.set("current", name);
				load_settings(name);
			};
		}

		var option = document.createElement("option");
		option.setAttribute("value", -1);
		option.appendChild(document.createTextNode("create new settings"));
		
		select.appendChild(option);	
		select.style.display = "inline";

		if (current_config){
			load_settings(current_config);
		}

		else {
			load_settings(config_names[0]);
		}
	}
	
	else {

		var endpoint_el = document.getElementById("endpoint");
		var name_el = document.getElementById("name");
		
		// endpoint_el.value = "https://whosonfirst-api.mapzen.com";
		// name_el.value = "default";

		select.style.display = "none";		
	}
	
	var save_button = document.getElementById("settings-save");
	save_button.onclick = save_settings;
}

reload_settings();
