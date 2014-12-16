(function() {
	'use strict';

	var L = require('leaflet');

	L.Routing = L.Routing || {};
	L.extend(L.Routing, require('./L.Routing.Util'));
	L.extend(L.Routing, require('./L.Routing.Waypoint'));

	L.Routing.GraphHopper = L.Class.extend({
		options: {
			serviceUrl: 'https://graphhopper.com/api/1/route',
			timeout: 30 * 1000
		},

		initialize: function(apiKey, options) {
			this._apiKey = apiKey;
			L.Util.setOptions(this, options);
		},

		route: function(waypoints, callback, context, options) {
			var timedOut = false,
				wps = [],
				url,
				timer,
				wp,
				i;

			options = options || {};
			url = this.buildRouteUrl(waypoints, options);

			timer = setTimeout(function() {
								timedOut = true;
								callback.call(context || callback, {
									status: -1,
									message: 'GraphHopper request timed out.'
								});
							}, this.options.timeout);

			// Create a copy of the waypoints, since they
			// might otherwise be asynchronously modified while
			// the request is being processed.
			for (i = 0; i < waypoints.length; i++) {
				wp = waypoints[i];
				wps.push(new L.Routing.Waypoint(wp.latLng, wp.name, wp.options));
			}

			L.Routing._jsonp(url, function(data) {
				clearTimeout(timer);
				if (!timedOut) {
					this._routeDone(data, wps, callback, context);
				}
			}, this, 'callback');

			return this;
		},

		_routeDone: function(response, inputWaypoints, callback, context) {
			var alts = [],
			    mappedWaypoints,
			    coordinates,
			    i,
			    path;

			context = context || callback;
			if (response.info.errors && response.info.errors.length) {
				callback.call(context, {
					// TODO: include all errors
					status: response.info.errors[0].details,
					message: response.info.errors[0].message
				});
				return;
			}

			for (i = 0; i < response.paths.length; i++) {
				path = response.paths[i];
				coordinates = L.Routing._decodePolyline(path.points, 5);
				mappedWaypoints =
					this._mapWaypointIndices(inputWaypoints, path.instructions, coordinates);

				alts.push({
					name: '',
					coordinates: coordinates,
					instructions: this._convertInstructions(path.instructions),
					summary: {
						totalDistance: path.distance,
						totalTime: path.time / 1000,
					},
					inputWaypoints: inputWaypoints,
					actualWaypoints: mappedWaypoints.waypoints,
					waypointIndices: mappedWaypoints.waypointIndices
				});
			}

			callback.call(context, null, alts);
		},

		_toWaypoints: function(inputWaypoints, vias) {
			var wps = [],
			    i;
			for (i = 0; i < vias.length; i++) {
				wps.push(L.Routing.waypoint(L.latLng(vias[i]),
				                            inputWaypoints[i].name,
				                            inputWaypoints[i].options));
			}

			return wps;
		},

		buildRouteUrl: function(waypoints, options) {
			var computeInstructions =
				!(options && options.geometryOnly),
				locs = [],
				i;

			for (i = 0; i < waypoints.length; i++) {
				locs.push('point=' + waypoints[i].latLng.lat + ',' + waypoints[i].latLng.lng);
			}

			return this.options.serviceUrl + '?' +
				locs.join('&') +
				'&instructions=' + computeInstructions +
				'&type=jsonp' +
				'&key=' + this._apiKey;
		},

		_convertInstructions: function(instructions) {
			var signToType = {
					'-3': 'SharpLeft',
					'-2': 'Left',
					'-1': 'SlightLeft',
					0: 'Straight',
					1: 'SlightRight',
					2: 'Right',
					3: 'SharpRight',
					4: 'DestinationReached',
					5: 'WaypointReached'
				},
				result = [],
			    i,
			    instr;

			for (i = 0; i < instructions.length; i++) {
				instr = instructions[i];
				result.push({
					type: signToType[instr.sign],
					text: instr.text,
					distance: instr.distance,
					time: instr.time / 1000,
					index: instr.interval[0]
				});
			}

			return result;
		},

		_mapWaypointIndices: function(waypoints, instructions, coordinates) {
			var wps = [],
				wpIndices = [],
			    i,
			    idx;

			wpIndices.push(0);
			wps.push(new L.Routing.Waypoint(coordinates[0], waypoints[0].name));

			for (i = 0; i < instructions.length; i++) {
				if (instructions[i].sign === 5) { // VIA_REACHED
					idx = instructions[i].interval[0];
					wpIndices.push(idx);
					wps.push(new L.Routing.Waypoint(coordinates[idx], waypoints[wps.length + 1].name));
				}
			}

			wpIndices.push(coordinates.length - 1);
			wps.push(new L.Routing.Waypoint(coordinates[coordinates.length - 1], waypoints[waypoints.length - 1].name));

			return {
				waypointIndices: wpIndices,
				waypoints: wps
			};
		}
	});

	L.Routing.graphHopper = function(options) {
		return new L.Routing.GraphHopper(options);
	};

	module.exports = L.Routing;
})();
