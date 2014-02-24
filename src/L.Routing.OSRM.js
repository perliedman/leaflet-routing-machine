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

	L.Routing.OSRM = L.Class.extend({
		includes: L.Mixin.Events,
		options: {
			serviceUrl: 'http://router.project-osrm.org/viaroute',
			geometryPrecision: 6
		},

		initialize: function(options) {
			L.Util.setOptions(this, options);
			this._hints = {
				locations: {}
			};
		},

		route: function(waypoints) {
			var url = this._buildRouteUrl(waypoints);

			L.Routing._jsonp(url, function(data) {
				this._routeDone(data, waypoints);
			}, this, 'jsonp');
		},

		_routeDone: function(response, waypoints) {
			if (response.status !== 0) {
				this.fire('error', {
					status: response.status,
					message: response.message
				});
				return;
			}

			var alts = [{
					name: response.route_name,
					geometry: this._decode(response.route_geometry, this.options.geometryPrecision),
					instructions: response.route_instructions,
					summary: response.route_summary,
					waypoints: response.via_points
				}],
			    i;

			for (i = 0; i < response.alternative_geometries.length; i++) {
				alts.push({
					name: response.alternative_names[i],
					geometry: this._decode(response.alternative_geometries[i], this.options.geometryPrecision),
					instructions: response.alternative_instructions[i],
					summary: response.alternative_summaries[i],
					waypoints: response.via_points
				})
			}

			this._saveHintData(response, waypoints);
			this.fire('routefound', {routes: alts});
		},

		_buildRouteUrl: function(waypoints) {
			var locs = [],
			    locationKey,
			    hint;

			for (var i = 0; i < waypoints.length; i++) {
				locationKey = this._locationKey(waypoints[i]);
				locs.push('loc=' + locationKey);

				hint = this._hints.locations[locationKey];
				if (hint) {
					locs.push('hint=' + hint);
				}
			}

			return this.options.serviceUrl + '?' +
				'instructions=true&' +
				locs.join('&') +
				(this._hints.checksum !== undefined ? '&checksum=' + this._hints.checksum : '');
		},

		_locationKey: function(location) {
			return location.lat + ',' + location.lng;
		},

		_saveHintData: function(route, waypoints) {
			var hintData = route.hint_data,
			    loc;
			this._hints = {
				checksum: hintData.checksum,
				locations: {}
			};
			for (var i = hintData.locations.length - 1; i >= 0; i--) {
				loc = waypoints[i];
				this._hints.locations[this._locationKey(loc)] = hintData.locations[i];
			}
		},

		// Adapted from
		// https://github.com/DennisSchiefer/Project-OSRM-Web/blob/develop/WebContent/routing/OSRM.RoutingGeometry.js
		_decode: function(encoded, precision) {
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
		}
	});

	L.Routing.osrm = function(options) {
		return new L.Routing.OSRM(options);
	};
})();
