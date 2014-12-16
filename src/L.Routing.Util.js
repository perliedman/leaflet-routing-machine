(function() {
	'use strict';

	L.Routing = L.Routing || {};

	L.Routing._jsonpCallbackId = 0;
	L.Routing._jsonp = function(url, callback, context, jsonpParam) {
		var callbackId = '_l_routing_machine_' + (L.Routing._jsonpCallbackId++),
			script;
		url += '&' + jsonpParam + '=' + callbackId;
		window[callbackId] = L.Util.bind(callback, context);
		script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = url;
		script.id = callbackId;
		document.getElementsByTagName('head')[0].appendChild(script);
	};

	// Adapted from
	// https://github.com/DennisSchiefer/Project-OSRM-Web/blob/develop/WebContent/routing/OSRM.RoutingGeometry.js
	L.Routing._decodePolyline = function(encoded, precision) {
		var len = encoded.length,
		    index=0,
		    lat=0,
		    lng = 0,
		    array = [];

		precision = Math.pow(10, -precision);

		while (index < len) {
			var b,
			    shift = 0,
			    result = 0;
			do {
				b = encoded.charCodeAt(index++) - 63;
				result |= (b & 0x1f) << shift;
				shift += 5;
			} while (b >= 0x20);
			var dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
			lat += dlat;
			shift = 0;
			result = 0;
			do {
				b = encoded.charCodeAt(index++) - 63;
				result |= (b & 0x1f) << shift;
				shift += 5;
			} while (b >= 0x20);
			var dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
			lng += dlng;
			//array.push( {lat: lat * precision, lng: lng * precision} );
			array.push( [lat * precision, lng * precision] );
		}
		return array;
	};

	module.exports = L.Routing;
})();
