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

	const db = require("./mapzen.whosonfirst.bookmarks.database.js");
	const conn = db.conn();
	
	const canvas = require("./mapzen.whosonfirst.bookmarks.canvas.js");

	const fb = require("./mapzen.whosonfirst.bookmarks.feedback.js");
	const namify = require("./mapzen.whosonfirst.bookmarks.namify.js");

	const maps = require("./mapzen.whosonfirst.bookmarks.maps.js");
	
	const dialogs = require("dialogs");		// https://www.npmjs.com/package/dialogs
	
	/*
	const desires = require("./mapzen.whosonfirst.bookmarks.desires.js");	
	const places = require("./mapzen.whosonfirst.bookmarks.places.js");
	const geojson = require("./mapzen.whosonfirst.bookmarks.geojson.js");
	const utils = require("./mapzen.whosonfirst.utils.js");
	*/
	
	var self = {
		
		'init': function(){
			
		},

		'create_new_list': function(cb){

			var d = dialogs();
			
			d.prompt("List name", "", function(name){

				if (name == undefined){
					return;
				}
								
				if (! name){
					fb.error("Invalid name");
					return false;
				}
				
				self.add_list(name, function(err){

					if (err){
						fb.error(err);
						return false;
					}
					
					cb();
				});
			})
		},

		'add_list': function(name, cb){

			var dt = new Date;
			dt = dt.toISOString();
			
			var sql = "INSERT INTO lists (name, created) VALUES (?,?)";
			var params = [ name, dt ];

			conn.run(sql, params, cb);
		},

		'add_list_item': function(list_id, wof_id, cb){

			var sql = "INSERT INTO list_items (list_id, wof_id) VALUES (?,?)";
			var params = [ list_id, wof_id ];

			conn.run(sql, params, cb);
		},
		
		'remove_list': function(id, cb){

			var sql = "DELETE FROM lists WHERE id = ?";
			var params = [ id ];
			
			conn.run(sql, params, function(err){

				if (err){
					console.log(sql, params, err);					
					cb(err);
					return;
				}

				self.remove_list_items(id, cb);
			})
		},

		'remove_list_items': function(list_id, cb){

			var sql = "DELETE FROM list_items WHERE list_id = ?";
			var params = [ list_id ];

			conn.run(sql, params, function(err){

				if (err){
					console.log(sql, params, err);
				}
				
				cb(err);
			});
		},

		'remove_list_item': function(list_id, wof_id, cb){

			var sql = "DELETE FROM list_items WHERE list_id = ? AND wof_id = ?";
			var params = [ list_id, wof_id ];

			conn.run(sql, params, function(err){

				if (err){
					console.log(sql, params, err);
				}
				
				cb(err);
			});
		},
		
		'get_lists': function(cb){

			var sql = "SELECT * FROM lists ORDER BY created DESC";
			var params = [];

			conn.all(sql, params, cb);
		},

		'get_list': function(id, cb){

			var sql = "SELECT * FROM lists WHERE id = ?";
			var params = [ id ];

			conn.get(sql, params, cb);			
		},

		'get_list_items': function(id, cb){

			var sql = "SELECT * FROM list_items WHERE list_id = ?";
			var params = [ id ];

			conn.all(sql, params, cb);			
		},

		'show_list': function(id){

			self.get_list(id, function(err, row){

				if (err){
					fb.error(err);
					return;
				}

				self.draw_list(row);
			});
		},

		'draw_list': function(row){

			var list_id = row["id"];
			var list_name = row["name"];
			
			var map_el = document.createElement("div");
			map_el.setAttribute("id", "map");

			var left_panel = document.createElement("div");
			left_panel.setAttribute("class", "col-md-6 panel");

			var right_panel = document.createElement("div");
			right_panel.setAttribute("class", "col-md-6 panel");

			left_panel.appendChild(map_el);

			var header = document.createElement("h2");
			header.appendChild(document.createTextNode(list_name));
			
			var items_wrapper = document.createElement("div");
			items_wrapper.setAttribute("id", "list-items-wrapper");

			right_panel.appendChild(header);
			right_panel.appendChild(items_wrapper);
			
			canvas.reset();
			canvas.append(left_panel);
			canvas.append(right_panel);			

			var map = maps.new_map(map_el);

			self.get_list_items(list_id, function(err, rows){

				if (err){
					return;
				}

				self.draw_list_items(rows, map);
			});			
		},

		'draw_list_items': function(rows, map){

			var list = document.createElement("list");
			
			var count_rows = rows.length;

			for (var i=0; i < count_rows; i++){

				var row = rows[i];
				var list_id = row["list_id"];				
				var wof_id = row["wof_id"];
				
				var span = document.createElement("span");
				span.setAttribute("class", "namify hey-look click-me");
				span.setAttribute("data-wof-id", wof_id);
				span.appendChild(document.createTextNode(wof_id));

				span.onclick = function(e){

					var el = e.target;
					var wof_id = el.getAttribute("data-wof-id");

					var places = require("./mapzen.whosonfirst.bookmarks.places.js");
					places.show_place(wof_id);
				};

				var remove = document.createElement("span");
				remove.setAttribute("class", "btn btn-sm remove");				
				remove.setAttribute("data-list-id", list_id);
				remove.setAttribute("data-wof-id", wof_id);				
				remove.appendChild(document.createTextNode("⃠"));

				remove.onclick = function(e){

					var el = e.target;
					var list_id = el.getAttribute("data-list-id");
					var wof_id = el.getAttribute("data-wof-id");					

					var q = "Are you sure you want to remove this item?";
					var d = dialogs();					

					d.confirm(q, function(ok){

						if (! ok){
							return;
						}

						self.remove_list_item(list_id, wof_id, function(err){

							if (err){
								fb.error(err);
								return false;
							}
							
							self.show_list(list_id);
						});
					});
				};
				
				var item = document.createElement("li");
				item.appendChild(span);
				item.appendChild(remove);				

				list.appendChild(item);
			}

			var wrapper = document.getElementById("list-items-wrapper");
			wrapper.appendChild(list);

			namify.translate();
		},
		
		'show_lists': function(){

			self.get_lists(function(err, rows){

				if (err){
					fb.error(err);
					return false;
				}

				self.draw_lists(rows);
			});
		},

		'draw_lists': function(rows){

			var left_panel = document.createElement("div");
			left_panel.setAttribute("class", "col-md-12 panel");

			var button = document.createElement("button");
			button.setAttribute("class", "btn btn-primary");
			button.appendChild(document.createTextNode("Create new list"));

			button.onclick = function(){

				self.create_new_list(self.show_lists);
			};
			
			var list = document.createElement("ul");
			list.setAttribute("class", "list");

			var count_rows = rows.length;

			for (var i=0; i < count_rows; i++){

				var row = rows[i];
				var list_id = row["id"];
				var list_name = row["name"];				
				
				var span = document.createElement("span");
				span.setAttribute("data-list-id", list_id);
				span.setAttribute("class", "hey-look click-me");
				span.appendChild(document.createTextNode(list_name));

				span.onclick = function(e){

					var el = e.target;
					var list_id = el.getAttribute("data-list-id");

					self.show_list(list_id);
				};
		
				var remove = document.createElement("span");
				remove.setAttribute("class", "btn btn-sm remove");				
				remove.setAttribute("data-list-id", list_id);
				remove.setAttribute("data-list-name", list_name);				
				remove.appendChild(document.createTextNode("⃠"));

				remove.onclick = function(e){

					var el = e.target;
					var list_id = el.getAttribute("data-list-id");
					var list_name = el.getAttribute("data-list-name");

					var q = "Are you sure you want to remove the list '" + list_name + "' ?";
					var d = dialogs();					

					d.confirm(q, function(ok){

						if (! ok){
							return;
						}

						self.remove_list(list_id, function(err){

							if (err){
								fb.error(err);
								return false;
							}
							
							self.show_lists();
						});
					});
				};
				
				var item = document.createElement("li");
				item.appendChild(span);
				item.appendChild(remove);				

				list.appendChild(item);
			}
			
			left_panel.appendChild(button);			
			left_panel.appendChild(list);
			
			canvas.draw(left_panel);			
		},
		
		'show_lists_menu': function(){

			self.get_lists(function(err, rows){

				if (err){
					fb.error(err);
					return false;
				}
				
			})
		},

		'render_lists_menu': function(rows, cb){

			var count_rows = rows.length;
			
			var select = document.createElement("select");
			select.setAttribute("id", "lists-menu");
			select.setAttribute("class", "form-control");

			var null_option = document.createElement("option");
			null_option.setAttribute("value", "0");
			null_option.appendChild(document.createTextNode(""));

			select.appendChild(null_option);
			
			for (var i=0; i < count_rows; i++){

				var row = rows[i];
				var list_id = row["id"];
				var list_name = row["name"];
				
				var option = document.createElement("option");
				option.setAttribute("value", list_id);
				option.appendChild(document.createTextNode(list_name));

				select.appendChild(option)
			}
			
			var create_option = document.createElement("option");
			create_option.setAttribute("value", "-1");
			create_option.appendChild(document.createTextNode("Create new list"));
			
			select.appendChild(create_option);

			select.onchange = function(e){

				var el = e.target;
				
				var wof_id = el.getAttribute("data-wof-id");

				if (! wof_id){
					console.log("missing WOF ID");
					return false;
				}
				
				var idx = el.selectedIndex;
				var list_id = el.options[idx].value;

				if (list_id == 0){
					return;
				}

				if (list_id == -1){
					
					self.create_new_list(function(err, row){

						if (err){
							cb(err);
						}

						console.log(row);
						return;

						var list_id = row["foo"];
						self.add_list_item(list_id, wof_id, cb);
					});
				}

				self.add_list_item(list_id, wof_id, cb);
			};
			
			return select;
		}
	}

	return self;
}));
