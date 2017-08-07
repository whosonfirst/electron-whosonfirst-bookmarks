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
	const dns = require("dns");	
	
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

				var mz_url = "https://tile.mapzen.com" + url;
				
				console.log("[proxy][cache] GET " + rel_path);

				var on_fetch = function(mz_rsp){
					
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
						
						cache.set(rel_path, mz_body, function(err){

							if (err){
								return;
							}
							
							console.log("[proxy][cache] SET " + rel_path);
						});
					});
				};
				
				var on_get = function(err, data){

					if (data){
						console.log("[proxy][cache] HIT " + rel_path);
						res.writeHead(200);	// TO DO: headers?
						res.write(data);
						res.end();
						return;
					}

					console.log("[proxy][cache] MISS " + rel_path);				
					console.log("[proxy] FETCH " + mz_url);

					// we need to do this in order to prevent these
					// errors when we are offline and trying to fetch
					// a cache MISS and because since proxy.js is
					// invoked as part of main.js we don't have access
					// to navigator.onLine - maybe there is a better
					// way to signal that DNS will fail by IPC messaging
					// but today we aren't doing that... (20170807/thisisaaronland)
					// 
					// Uncaught Exception:
					// Error: getaddrinfo ENOTFOUND tile.mapzen.com tile.mapzen.com:443
					// at errnoException (dns.js:28:10)
					// at GetAddrInfoReqWrap.onlookup [as oncomplete] (dns.js:76:26)
					
					dns.lookup("tile.mapzen.com", function(err){

						if (err){
							console.log("[proxy] ERR unable to proxy tile because DNS lookup failed", err.code);
							res.writeHead(503);
							res.end();
							return;						
						}
						
						https.get(mz_url, on_fetch);
					});

				};
				
				cache.get(rel_path, on_get);
			});
			
			return server;
		}
		
	};

	return self;
}));
