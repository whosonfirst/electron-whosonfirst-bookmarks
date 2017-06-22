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

	var self = {
		
		'append_class': function(el, class_name){

			if (! el){
				console.log("trying to call append_class on a null element");
				return;
			}
			
			var c = el.getAttribute("class");
			c = (c) ? c.split(" ") : [];
			
			c.push(class_name);
			c = c.join(" ");
			
			el.setAttribute("class", c);
		},
		
		'remove_class': function(el, class_name){
			
			if (! el){
				console.log("trying to call remove_class on a null element");
				return;
			}

			var c = el.getAttribute("class");
			c = (c) ? c.split(" ") : [];			

			var count = c.length;
			var tmp = [];

			for (var i = 0; i < count; i++){

				var cl = c[i];

				if (cl != class_name){
					tmp.push(cl);
				}
			}

			c = tmp.join(" ");
			el.setAttribute("class", c);
		},
		
		'render_expandable': function(el, args){

			if (! args){
				args = {};
			}

			var label = args["label"] || "details";
			var open = args["open"] || false;
						
			var eid = Math.random().toString(36).replace("0.", "");
			
			var expand = "⇣";
			var collapse = "⇡";

			var control_state = (open) ? collapse : expand;
			var content_state = (open) ? "block" : "none";
			
			var wrapper = document.createElement("div");
			wrapper.setAttribute("data-expandable-id", eid);			
			wrapper.setAttribute("id", "expandable-" + eid);
			wrapper.setAttribute("class", "expandable");			
			
			var header = document.createElement("h3");
			header.setAttribute("id", "expandable-header-" + eid);			
			header.setAttribute("data-expandable-id", eid);
			header.appendChild(document.createTextNode(label));

			var control = document.createElement("span");
			control.setAttribute("id", "expandable-control-" + eid);			
			control.setAttribute("class", "control data-expandable-control");
			control.setAttribute("data-expandable-id", eid);
			control.appendChild(document.createTextNode(control_state));

			header.appendChild(control);
			
			header.onclick = function(e){

				var el = e.target;
				var eid = el.getAttribute("data-expandable-id");

				var cnt = document.getElementById("expandable-content-" + eid);
				var ctl = document.getElementById("expandable-control-" + eid);
				
				if (cnt.style.display == "none"){
					cnt.style.display = "block";
					ctl.innerText = collapse;
				}

				else {
					cnt.style.display = "none";
					ctl.innerText = expand;
				}
			};

			
			var content = document.createElement("div");
			content.setAttribute("id", "expandable-content-" + eid);
			content.setAttribute("style", "display:" + content_state);			

			content.appendChild(el);
			
			wrapper.appendChild(header);
			wrapper.appendChild(content);
			
			return wrapper;
		},
		
		'render_object': function(o){

			if (Array.isArray(o)){

				var count_o = o.length;
				
				var list = document.createElement("ol");
				list.setAttribute("class", "object-list");
				
				for (var i=0; i < count_o; i++){

					var v = o[i];
					
					var item = document.createElement("li");
					item.setAttribute("class", "object-list-item");
					item.appendChild(self.render_object(v));
					
					list.appendChild(item);
				}

				return list;
			}
			
			else if (typeof(o) == "object"){

				var table = document.createElement("table");
				table.setAttribute("class", "table object-table");
				
				for (var k in o){

					var v = o[k];
					
					var tr = document.createElement("tr");
					tr.setAttribute("class", "table object-table-row");
					
					var th = document.createElement("th");
					th.setAttribute("class", "table object-table-header");
					
					var td = document.createElement("td");
					td.setAttribute("class", "table object-table-cell");
					
					th.appendChild(document.createTextNode(k));

					v = self.render_object(v);
					td.appendChild(v);

					tr.appendChild(th);
					tr.appendChild(td);

					table.appendChild(tr);
				}

				return table;				
			}

			else {

				var span = document.createElement("span");
				span.setAttribute("class", "object-value");
				span.appendChild(document.createTextNode(o));

				return span
			}
		}
		
	};

	return self;

}));
