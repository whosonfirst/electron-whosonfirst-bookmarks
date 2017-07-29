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

	const http = require("http");
	const https = require("https");
	
	const crypto = require("crypto");
	const u = require("url");
	
	var self = {

		'server': function(cache){

			// sudo fix me to generate TLS-stuff at start-up and
			// use https.createServer...
			
			var server = http.createServer();
			
			// https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/
			
			server.on("request", function (req, res){
				
				// https://tile.mapzen.com/mapzen/vector/v1/all/15/9685/11719.topojson?api_key=mapzen-xxxxx
				// https://nodejs.org/api/http.html#http_class_http_incomingmessage
				
				const { method, url } = req;
				var p = u.parse(url, true);	// true as in "tease out query parameters"

				var rel_path = p.pathname;

				if (rel_path == "/"){
					res.writeHead(404);
					res.end();
					return;
				}

				console.log("[proxy][request] " + rel_path);
				
				var data = cache.get(rel_path);
				var len = 0;

				if (data){
					len = data.length;
				}
				
				console.log("[proxy][request] CACHE " + len);
				
				if (data){

					console.log("[proxy][cache] HIT");
					
					res.writeHead(200);	// TO DO: headers?
					res.write(data);
					res.end();
					return;
				}
								
				var mz_url = "https://tile.mapzen.com" + url;
				console.log("[proxy][fetch] " + mz_url);
				
				https.get(mz_url , function(mz_rsp){
					
					mz_rsp.setEncoding('utf8');
					
					var mz_status = mz_rsp.statusCode;
					var mz_headers = mz_rsp.headers;
					var mz_body = '';
					
					if (mz_status != 200){
						res.writeHead(mz_status, mz_headers);
						res.end();
						return;
					}
										
					res.writeHead(mz_status, mz_headers);				
					
					mz_rsp.on('data', function (data){
						res.write(data);
						mz_body += data;
					});
					
					mz_rsp.on('end', function(){
						res.end();						
						cache.set(rel_path, mz_body);
						console.log("[proxy][fetch] COMPLETE");
					});
					
				});
			});

			return server;
		}
		
	};

	return self;
}));
