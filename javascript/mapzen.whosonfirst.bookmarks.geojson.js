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
		},

		'add_visits_to_map': function(map, visits){

			var feature_collection = self.visits_to_featurecollection(visits);
			return self.add_featurecollection_to_map(map, feature_collection);			
		},

		'add_place_to_map': function(map, pl){

			var pt = pl["wof:placetype"];

			var geom;
			
			switch (pt) {

			case "venue":

				var lat = pl["geom:latitude"];
				var lon = pl["geom:longitude"];			

				if ((pl["lbl:latitude"]) && (pl["lbl:longitude"])){
					lat = pl["lbl:latitude"];
					lon = pl["lbl:longitude"];				
				}

				var coords = [ lon, lat ];
				
				geom = {
					"type": "Point",
					"coordinates": coords
				};
				
			default:

				var bbox = pl["geom:bbox"];
				bbox = bbox.split(",");

				var swlon = bbox[0];
				var swlat = bbox[1];
				var nelon = bbox[2];
				var nelat = bbox[3];
				
			};

			if (! geom){
				fb.warning("Unable to generate geometry for placetype");
				return false;
			}

			
		},
		
		'visits_to_featurecollection': function(visits){

			var features = [];
			
			var count_visits = visits.length;

			for (var i=0; i < count_visits; i++){

				var visit = visits[i];
				
				var lat = visit['latitude'];
				var lon = visit['longitude'];

				var coords = [ lon, lat ];
				
				var geom = {
					"type": "Point",
					"coordinates": coords,
				};

				var props = {};

				var feature = {
					"type": "Feature",
					"geometry": geom,
					"properties": props,
				};

				features.push(feature);
			}

			var feature_collection = {
				"type": "FeatureCollection",
				"features": features,
			};

			return feature_collection;
		}
	}

	return self;
}));
