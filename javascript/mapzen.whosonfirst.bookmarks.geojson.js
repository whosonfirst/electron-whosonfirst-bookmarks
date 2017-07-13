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
	
	const maps = require("./mapzen.whosonfirst.bookmarks.maps.js");	
	const fb = require("./mapzen.whosonfirst.bookmarks.feedback.js");

	const styles = {
		"bbox": {
			"color": "#ff0099",
			"weight": 1,
			"opacity": 1,
			"radius": 2,
			"fillColor": "#ffff00",
			"fillOpacity": .3
		},
		"point": {
			"color": "#000",
			"weight": 2,
			"opacity": 1,
			"radius": 6,
			"fillColor": "#0BBDFF",
			"fillOpacity": 1
		},
		"point_transit": {
			"color": "#000",
			"weight": 2,
			"opacity": 1,
			"radius": 6,
			"fillColor": "#FFA500",
			"fillOpacity": 1
		}
		
	};
			
	const handlers = {
		"point": function(style){
			
			return function(feature, latlon){

				// console.log(feature);
				
				var m = L.circleMarker(latlon, style);
				return m;
			};
		},
	};
		
	var self = {
		
		'init': function(){
			
		},

		// methods are divided in to 3 basic classes
		// generally methods should be organized (in
		// classes) alphabetically but that is not always
		// the reality...
		
		// bookmarks-thing-to-geojson-thing
		// add-bookmarks-thing-to-map
		// add-geojson-thing-to-map

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
		
		'transit_stops_to_featurecollection': function(rows){

			var features = [];
			
			var count_rows = rows.length;

			for (var i=0; i < count_rows; i++){

				var row = rows[i];

				var geom = row["geometry"];

				var props = {};

				var feature = {
					"type": "Feature",
					"geometry": geom,
					"properties": props,
				};

				features.push(feature);				
			}

			var featurecollection = {
				"type": "FeatureCollection",
				"features": features,
			};

			return featurecollection;			
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
		
		// add-bookmarks-thing-to-map
		
		'add_visit_to_map': function(map, visit){

			var lat = visit["latitude"];
			var lon = visit["longitude"];

			var more = {
				"z-index": 500
			};
			
			return self.add_latlon_to_map(map, lat, lon, 16, more);
		},
		
		'add_place_to_map': function(map, pl){
			
			var more = {
				"z-index": 100,
			};
			
			var pt = pl["wof:placetype"];

			var lat = pl["geom:latitude"];
			var lon = pl["geom:longitude"];
			
			if ((pl["lbl:latitude"]) && (pl["lbl:longitude"])){				
				lat = pl["lbl:latitude"];
				lon = pl["lbl:longitude"];				
			}
			
			if (pt == "venue"){
				self.add_latlon_to_map(map, lat, lon, null, more);
				return;
			}

			var bbox = pl["geom:bbox"];
			bbox = bbox.split(",");

			var min_lat = bbox[1];
			var min_lon = bbox[0];			
			var max_lat = bbox[3];
			var max_lon = bbox[2];

			if ((min_lat == max_lat) && (min_lon == max_lon)){
				self.add_latlon_to_map(map, lat, lon, null, more);
				return;
			}

			var mz_uri = pl["mz:uri"];

			if (mz_uri){

				var on_success = function(layer){
					// 
				};
				
				var on_error = function(e){
					self.add_bbox_to_map(map, min_lat, min_lon, max_lat, max_lon, more);
					return;
				};
					
				self.add_mzuri_to_map(map, mz_uri, on_success, on_error);
				return;
			}

			return self.add_bbox_to_map(map, min_lat, min_lon, max_lat, max_lon, more);
		},

		'add_mzuri_to_map': function(map, mz_uri, on_success, on_error){

			var more = {
				"z-index": 100,
				"style": styles["bbox"]
			};
			
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
				
				var layer = self.add_geojson_to_map(map, feature, more);
				on_success(layer);
			};

			req.open("get", mz_uri, true);
			req.send();
		},

		'add_visits_to_map': function(map, visits){

			var feature_collection = self.visits_to_featurecollection(visits);

			var more = {
				"z-index": 500
			};
			
			return self.add_featurecollection_to_map(map, feature_collection, more);
		},

		'add_transit_stops_to_map': function(stops, map){

			if (! stops){
				return;
			}

			var count_stops = stops.length;

			if (! count_stops){
				return;
			};

			var featurecollection = self.transit_stops_to_featurecollection(stops);

			var more = {
				"style": styles["point_transit"],
				"z-index": 200,
			};
			
			return self.add_featurecollection_to_map(map, featurecollection, more);
		},
		
		// add geojson-thing-to-map
		
		'add_bbox_to_map': function(map, min_lat, min_lon, max_lat, max_lon, more){

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

			var layer = self.add_geojson_to_map(map, feature, more);
			return layer;
		},

		'add_latlon_to_map': function(map, lat, lon, zoom, more){

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

			if (zoom){
				map.setView([lat, lon], 16);
			}
			
			return self.add_geojson_to_map(map, feature, more);
		},

		'add_featurecollection_to_map': function(map, featurecollection, more){

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
				return self.add_latlon_to_map(map, min_lat, min_lon, null, more);
			}
			
			var sw = L.latLng(min_lat, min_lon);
			var ne = L.latLng(max_lat, max_lon);
			
			var bounds = L.latLngBounds(sw, ne);
			var opts = { "padding": [100, 100] };
			
			map.fitBounds(bounds, opts);
			
			var layer = self.add_geojson_to_map(map, featurecollection, more);
			return layer;
		},

		'add_geojson_to_map': function(map, geojson, more){

			if (! more){
				more = {};
			}

			var style = more["style"];
			var handler = more["handler"];
			
			if (! style){
				style = styles["point"];
			}

			if (! handler){
				handler = handlers["point"](style);
			}
			
			var args = {
				"style": style,
				"pointToLayer": handler
			}

			var layer = L.geoJSON(geojson, args);
			layer.addTo(map);

			// http://leafletjs.com/reference-1.1.0.html#layergroup-setzindex
			
			if (more["z-index"]){
				layer.setZIndex(more["z-index"]);
			}
			
			return layer;			
		},

		// t is for "tangram"
		
		't_add_geojson_to_map': function(map, geojson){

			// this doesn't work yet and really it seems like a kludge
			// what we really want to do is, when we trigger a Tangram
			// screenshot event, is to find all the GeoJSON Leaflet layers
			// and convert them equivalent Tangram scene/layer thingies
			// (20170707/thisisaaronland)
			
			return;

			/*
			map.eachLayer(function(l){
				console.log(l);
			});
			*/
			
			// HACK...
			var scene = maps.get_scene();

			if (! scene){
				setTimeout(function(){
					self.t_add_geojson_to_map(map, geojson);
				}, 1000);

				return;
			}
			
			var polys = {
				"color": "rgba(255, 255, 0, 0.6)"
			};
			
			var lines = {
				"color": "rgb(255, 0, 153)", "width": "4px", "order":1000
			};
			
			var source_id = "debug";

			scene.config.layers.fixme = {
		      		"data": {
					"source": source_id
				},
				"draw": {
					"polygons-overlay": polys,
					"lines": lines
				}
			};
		    
			scene.config.styles['polygons-overlay'] = { "base": "polygons",  "blend": "overlay" };
			
			var source = {
				"type": "GeoJSON",
				"data": geojson
			};

			scene.setDataSource(source_id, source);

			scene.updateConfig({ rebuild: true }).then(function() {});
			scene.updateConfig({ rebuild: true }).then(function() {});
		}
		
	}

	return self;
}));
