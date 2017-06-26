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

	const dialogs = require("dialogs");		// https://www.npmjs.com/package/dialogs
	
	/*
	const desires = require("./mapzen.whosonfirst.bookmarks.desires.js");	
	const places = require("./mapzen.whosonfirst.bookmarks.places.js");
	const namify = require("./mapzen.whosonfirst.bookmarks.namify.js");
	const maps = require("./mapzen.whosonfirst.bookmarks.maps.js");	
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

		'remove_list_items': function(id, cb){

			var sql = "DELETE FROM list_items WHERE list_id = ?";
			var params = [ id ];

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
				span.setAttribute("class", "hey-look click-me");
				span.appendChild(document.createTextNode(list_name));

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

		'render_lists_menu': function(rows){

			var count_rows = rows.length;
			
			var select = document.createElement("select");
			select.setAttribute("id", "lists-menu");
			select.setAttribute("class", "form-control");

			var create_option = document.createElement("option");
			create_option.setAttribute("value", "0");
			create_option.appendChild(document.createTextNode("Add to list"));
			
			for (var i=0; i < count_rows; i++){

				var row = rows[i];
				
				var option = document.createElement("option");
				option.setAttribute("value", row[i]);
				option.appendChild(document.createTextNode(row["name"]));
			}
			
			var create_option = document.createElement("option");
			create_option.setAttribute("value", "-1");
			create_option.appendChild(document.createTextNode("Create new list"));
			
			select.appendChild(create_option);
			return select;
		}
	}

	return self;
}));
