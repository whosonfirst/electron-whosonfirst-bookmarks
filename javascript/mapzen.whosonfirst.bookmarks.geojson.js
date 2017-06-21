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
		
		'init': function(){
			
		},

		'add_latlon_to_map': function(map, lat, lon, zoom){

			if (! zoom){
				zoom = 16;
			}
			
			var coords = [ lon, lat ];
			var geom = {
				"type": "Point",
				"coordinates": coords
			};

			var props = {};

			var feature = {
				"type": "Feature",
				"geometry": geom,
				"properties": props,
			};

			map.setView([lat, lon], 16);

			var layer = L.geoJSON(feature).addTo(map);
			return layer;				
		},

		'add_featurecollection_to_map': function(map, fc){

			var swlat;
			var swlon;
			var nelat;
			var nelon;

			var features = fc["features"];
			var count_features = features.length;

			for (var i=0; i < count_features; i++){
				
				var feature = features[i];
				var geom = feature["geometry"];
				var coords = geom["coordinates"];
				
				var lat = coords[1];
				var lon = coords[0];

				if ((! swlat) || (lat < swlat)){
					swlat = lat;
				}
				
				if ((! swlon) || (lat < swlon)){
					swlon = lon;
				}
				
				if ((! nelat) || (lat > nelat)){
					nelat = lat;
				}
				
				if ((! nelon) || (lat > nelon)){
					nelon = lon;
				}						
			}
			
			var sw = L.latLng(swlat, swlon);
			var ne = L.latLng(nelat, nelon);

			console.log(sw, ne);
			
			var bounds = L.latLngBounds(sw, ne);
			var opts = { "padding": [50, 50] };
			
			map.fitBounds(bounds, opts);

			console.log(map.getBounds());
			
			var layer = L.geoJSON(fc).addTo(map);
			return layer;
		}
	}

	return self;
}));
