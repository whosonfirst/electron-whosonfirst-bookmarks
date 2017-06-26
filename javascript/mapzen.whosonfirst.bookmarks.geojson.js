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

	const fb = require("./mapzen.whosonfirst.bookmarks.feedback.js");

	const styles = {
		"bbox": {
			"color": "#ff0099",
			"weight": 3,
			"opacity": 1,
			"radius": 2,
			"fillColor": "#000",
			"fillOpacity": 0
		},
		"point": {
			"color": "#000",
			"weight": 2,
			"opacity": 1,
			"radius": 6,
			"fillColor": "#0BBDFF",
			"fillOpacity": 1
		}
	};
			
	const handlers = {
		"point": function(style){
			return function(feature, latlon){
				var m = L.circleMarker(latlon, style);
				return m;
			};
		},
	};
		
	var self = {
		
		'init': function(){
			
		},

		'add_visit_to_map': function(map, visit){

			var lat = visit["latitude"];
			var lon = visit["longitude"];

			return self.add_latlon_to_map(map, lat, lon);
		},
		
		'add_place_to_map': function(map, pl){

			var pt = pl["wof:placetype"];

			var lat = pl["geom:latitude"];
			var lon = pl["geom:longitude"];
			
			if ((pl["lbl:latitude"]) && (pl["lbl:longitude"])){				
				lat = pl["lbl:latitude"];
				lon = pl["lbl:longitude"];				
			}
			
			if (pt == "venue"){
				self.add_latlon_to_map(map, lat, lon);
				return;
			}

			var bbox = pl["geom:bbox"];
			bbox = bbox.split(",");

			var min_lat = bbox[1];
			var min_lon = bbox[0];			
			var max_lat = bbox[3];
			var max_lon = bbox[2];

			if ((min_lat == max_lat) && (min_lon == max_lon)){
				self.add_latlon_to_map(map, lat, lon);
				return;
			}

			var mz_uri = pl["mz:url"];

			if (mz_uri){

				var on_error = function(e){
					self.add_bbox_to_map(map, min_lat, min_lon, max_lat, max_lon);
					return;
				};
					
				self.add_mzuri_to_map(map, mz_uri, on_success, on_error);
				return;
			}

			self.add_bbox_to_map(map, min_lat, min_lon, max_lat, max_lon);			
		},

		'add_mzuri_to_map': function(map, mz_uri, on_error){

			var req = new XMLHttpRequest();

			req.onload = function(){

				var feature;
				
				try {
					feature = JSON.parse(this.responseText);
				}

				catch (e){
					on_error(e);
					return false;
				}

				var props = feature["properties"];
				var bbox = props["geom:bbox"];

				bbox = bbox.split(",");

				var min_lat = bbox[1];
				var min_lon = bbox[0];				
				var max_lat = bbox[3];
				var max_lon = bbox[2];				
				
				var sw = L.latLng(min_lat, min_lon);
				var ne = L.latLng(max_lat, max_lon);

				var bounds = L.latLngBounds(sw, ne);
				var opts = { "padding": [100, 100] };
				
				map.fitBounds(bounds, opts);

				self.add_geojson_to_map(map, feature, styles["bbox"]);
			};

			req.open("get", url, true);
			req.send();
		},
		
		'add_bbox_to_map': function(map, min_lat, min_lon, max_lat, max_lon){

			var coords = [[
				[ min_lon, min_lat ],
				[ min_lon, max_lat ],
				[ max_lon, max_lat ],
				[ max_lon, min_lat ],
				[ min_lon, min_lat ]
			]];

			var geom = {
				"type": "Polygon",
				"coordinates": coords
			};

			var props = {};

			var feature = {
				"type": "Feature",
				"geometry": geom,
				"properties": props,
			};

			var sw = L.latLng(min_lat, min_lon);
			var ne = L.latLng(max_lat, max_lon);

			var bounds = L.latLngBounds(sw, ne);
			var opts = { "padding": [100, 100] };
			
			map.fitBounds(bounds, opts);

			self.add_geojson_to_map(map, feature, styles["bbox"]);
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

			self.add_geojson_to_map(map, feature, styles["point"], handlers["point"]);
		},

		'add_featurecollection_to_map': function(map, featurecollection){

			var min_lat;
			var min_lon;
			var max_lat;
			var max_lon;

			var features = featurecollection["features"];
			var count_features = features.length;

			for (var i=0; i < count_features; i++){
				
				var feature = features[i];
				var geom = feature["geometry"];
				var coords = geom["coordinates"];
				
				var lat = coords[1];
				var lon = coords[0];
				
				if ((! min_lat) || (lat < min_lat)){
					min_lat = lat;
				}
				
				if ((! min_lon) || (lat < min_lon)){
					min_lon = lon;
				}
				
				if ((! max_lat) || (lat > max_lat)){
					max_lat = lat;
				}
				
				if ((! max_lon) || (lat > max_lon)){
					max_lon = lon;
				}						
			}

			if ((min_lat == max_lat) && (min_lon == max_lon)){
				return self.add_latlon_to_map(map, min_lat, min_lon);
			}
			
			var sw = L.latLng(min_lat, min_lon);
			var ne = L.latLng(max_lat, max_lon);
			
			var bounds = L.latLngBounds(sw, ne);
			var opts = { "padding": [100, 100] };
			
			map.fitBounds(bounds, opts);

			self.add_geojson_to_map(map, featurecollection, styles["point"], handlers["point"]);
		},

		'add_visits_to_map': function(map, visits){

			var feature_collection = self.visits_to_featurecollection(visits);
			return self.add_featurecollection_to_map(map, feature_collection);			
		},

		'places_to_featurecollection': function(rows){

			var features = [];
			
			var count_rows = rows.length;

			for (var i=0; i < count_rows; i++){

				var row = rows[i];

				var pl = JSON.parse(row["body"]);
				
				var lat = pl['geom:latitude'];
				var lon = pl['geom:longitude'];

				if ((pl['lbl:latitude']) && (pl['lbl:longitude'])){
					lat = pl['lbl:latitude'];
					lon = pl['lbl:longitude'];
				}
			
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
		},

		'add_geojson_to_map': function(map, geojson, style, handler){

			var args = {};

			if (style){
				args["style"] = style;
			}

			if ((handler) && (style)){
				handler = handler(style);	// I don't love this...
				args["pointToLayer"] = handler;
			}
			
			var layer = L.geoJSON(geojson, args);

			layer.addTo(map);
			return layer;			
		}
	}

	return self;
}));
