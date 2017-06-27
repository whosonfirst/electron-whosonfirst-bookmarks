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

	// https://transit.land/documentation/datastore/api-endpoints.html

	const endpoint = 'https://transit.land/api/v1';
	
	var self = {

		'get_nearby': function(lat, lon, cb){

			var r = 200;
			
			var enc_lat = lat;
			var enc_lon = lon;
			var enc_r = r;
			
			var url = endpoint + '/stops?lon=' + enc_lon + '&lat=' + enc_lat + '&r=' + enc_r;

			var req = new XMLHttpRequest();

			req.onload = function(){

				var rsp;
				
				try {
					rsp = JSON.parse(this.responseText);
				}

				catch (e){
					cb(e);
					return false;
				}

				cb(null, rsp);
			};

			req.open("get", url, true);
			req.send();			
		},

		'render_stops': function(rows){

			var wrapper = document.createElement("div");
			wrapper.setAttribute("class", "nearby-transit-stops");
			
			if (! rows){

				return wrapper;
			}

			var count_stops = rows.length;

			if (! count_stops){

				return wrapper;				
			}

			var list = document.createElement("ul");
			list.setAttribute("class", "list nearby-transit-stops-list");
			
			for (var i=0; i < count_stops; i++){

				var stop = rows[i];
				
				var name = stop["name"];
				var osid = stop["onestop_id"];

				var item = document.createElement("li");
				item.setAttribute("class", "nearby-transit-stops-list-item");
				item.setAttribute("data-onestop-id", osid);

				var served_by = stop["served_by_vehicle_types"];
				served_by = served_by.join(", ");
				
				item.setAttribute("data-served-by", served_by);

				var span = document.createElement("span");
				span.setAttribute("class", "hey-look");
				span.appendChild(document.createTextNode(name));
				
				item.appendChild(span);

				var routes = stop["routes_serving_stop"];
				var count_routes = routes.length;

				if (count_routes){
					
					var routes_list = document.createElement("ul");
					routes_list.setAttribute("class", "list-inline nearby-transit-stops-list-item-routes");

					for (var j=0; j < count_routes; j++){

						var route = routes[j];

						var route_name = route["route_name"];
						var route_operator = route["operator_name"];

						var routes_item = document.createElement("li");
						routes_item.setAttribute("data-operator-name", route_operator);

						routes_item.appendChild(document.createTextNode(route_name));
						routes_list.appendChild(routes_item);
					}

					item.appendChild(routes_list);
				}

				list.appendChild(item);
				
			}

			wrapper.appendChild(list);
			return wrapper;	
		}
	}

	return self;
}));
