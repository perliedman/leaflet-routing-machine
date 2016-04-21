(function() {
	'use strict';

	var L = require('leaflet'),
		corslite = require('corslite'),
		polyline = require('polyline');

	// Ignore camelcase naming for this file, since OSRM's API uses
	// underscores.
	/* jshint camelcase: false */

	L.Routing = L.Routing || {};
	L.extend(L.Routing, require('./L.Routing.Waypoint'));

	/**
	 * Works against OSRM's new API in version 5.0; this has
	 * the API version v1.
	 */
	L.Routing.OSRMv1 = L.Class.extend({
		options: {
			serviceUrl: 'http://router.project-osrm.org/route/v1',
			profile: 'driving',
			timeout: 30 * 1000,
			routingOptions: {
				alternatives: true,
				steps: true
			},
			polylinePrecision: 5
		},

		initialize: function(options) {
			L.Util.setOptions(this, options);
			this._hints = {
				locations: {}
			};
		},

		route: function(waypoints, callback, context, options) {
			var timedOut = false,
				wps = [],
				url,
				timer,
				wp,
				i;

			url = this.buildRouteUrl(waypoints, L.extend({}, this.options.routingOptions, options));

			timer = setTimeout(function() {
				timedOut = true;
				callback.call(context || callback, {
					status: -1,
					message: 'OSRM request timed out.'
				});
			}, this.options.timeout);

			// Create a copy of the waypoints, since they
			// might otherwise be asynchronously modified while
			// the request is being processed.
			for (i = 0; i < waypoints.length; i++) {
				wp = waypoints[i];
				wps.push(new L.Routing.Waypoint(wp.latLng, wp.name, wp.options));
			}

			corslite(url, L.bind(function(err, resp) {
				var data,
					errorMessage,
					statusCode;

				clearTimeout(timer);
				if (!timedOut) {
					errorMessage = 'HTTP request failed: ' + err;
					statusCode = -1;

					if (!err) {
						try {
							data = JSON.parse(resp.responseText);
							try {
								return this._routeDone(data, wps, options, callback, context);
							} catch (ex) {
								statusCode = -3;
								errorMessage = ex.toString();
							}
						} catch (ex) {
							statusCode = -2;
							errorMessage = 'Error parsing OSRM response: ' + ex.toString();
						}
					}

					callback.call(context || callback, {
						status: statusCode,
						message: errorMessage
					});
				}
			}, this));

			return this;
		},

		_routeDone: function(response, inputWaypoints, options, callback, context) {
			var alts = [],
			    actualWaypoints,
			    i,
			    route;

			context = context || callback;
			if (response.code !== 'Ok') {
				callback.call(context, {
					status: response.code
				});
				return;
			}

			actualWaypoints = this._toWaypoints(inputWaypoints, response.waypoints);

			for (i = 0; i < response.routes.length; i++) {
				route = this._convertRoute(response.routes[i], options.geometryOnly);
				route.inputWaypoints = inputWaypoints;
				route.waypoints = actualWaypoints;
				alts.push(route);
			}

			this._saveHintData(response.waypoints, inputWaypoints);

			callback.call(context, null, alts);
		},

		_convertRoute: function(responseRoute, geometryOnly) {
			var result = {
					name: '', // TODO
					summary: {
						totalDistance: responseRoute.distance,
						totalTime: responseRoute.duration
					}
				},
				coordinates = [],
				instructions = [],
				index = 0,
				legCount = responseRoute.legs.length,
				i,
				j,
				leg,
				step,
				geometry,
				type;

			if (geometryOnly) {
				result.coordinates = this._decodePolyline(responseRoute.geometry);
				return result;
			}

			for (i = 0; i < legCount; i++) {
				leg = responseRoute.legs[i];
				for (j = 0; j < leg.steps.length; j++) {
					step = leg.steps[j];
					geometry = this._decodePolyline(step.geometry);
					coordinates.push(geometry);
					type = this._maneuverToInstructionType(step.maneuver, i === legCount - 1);
					if (type) {
						instructions.push({
							type: type,
							distance: step.distance,
							time: step.duration,
							road: step.name,
							direction: this._bearingToDirection(step.maneuver.bearing_after),
							exit: step.maneuver.exit,
							index: index
						});
					}

					index += geometry.length;
				}
			}

			result.coordinates = Array.prototype.concat.apply([], coordinates);
			result.instructions = instructions;

			return result;
		},

		_bearingToDirection: function(bearing) {
			var oct = Math.round(bearing / 45) % 8;
			return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][oct];
		},

		_maneuverToInstructionType: function(maneuver, lastLeg) {
			switch (maneuver.type) {
			case 'turn':
			case 'end of road':
				switch (maneuver.modifier) {
				case 'straight':
					return 'Straight';
				case 'slight right':
					return 'SlightRight';
				case 'right':
					return 'Right';
				case 'sharp right':
					return 'SharpRight';
				case 'sharp left':
					return 'SharpLeft';
				case 'left':
					return 'Left';
				case 'slight left':
					return 'SlightLeft';
				case 'uturn':
					return 'TurnAround';
				default:
					return null;
				}
				break;
			case 'new name':
			case 'merge':
			case 'ramp':
			case 'fork':
				return 'Continue';
			case 'arrive':
				return lastLeg ? 'DestinationReached' : 'WaypointReached';
			case 'roundabout':
			case 'rotary':
				return 'Roundabout';
			default:
				return null;
			}
		},

		_decodePolyline: function(routeGeometry) {
			var cs = polyline.decode(routeGeometry, this.options.polylinePrecision),
				result = new Array(cs.length),
				i;
			for (i = cs.length - 1; i >= 0; i--) {
				result[i] = L.latLng(cs[i]);
			}

			return result;
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

		_createName: function(nameParts) {
			var name = '',
				i;

			for (i = 0; i < nameParts.length; i++) {
				if (nameParts[i]) {
					if (name) {
						name += ', ';
					}
					name += nameParts[i].charAt(0).toUpperCase() + nameParts[i].slice(1);
				}
			}

			return name;
		},

		buildRouteUrl: function(waypoints, options) {
			var locs = [],
				hints = [],
				wp,
				latLng,
			    computeInstructions,
			    computeAlternative;

			for (var i = 0; i < waypoints.length; i++) {
				wp = waypoints[i];
				latLng = wp.latLng;
				locs.push(latLng.lng + ',' + latLng.lat);
				hints.push(this._hints[this._locationKey(latLng)] || '');
			}

			computeAlternative = computeInstructions =
				!(options && options.geometryOnly);

			return this.options.serviceUrl + '/' + this.options.profile + '/' +
				locs.join(';') + '?' +
				(options.z ? 'z=' + options.z + '&' : (options.geometryOnly ? 'overview=full&' : '')) +
				//'hints=' + hints.join(';') + '&' +
				'alternatives=' + computeAlternative.toString() + '&' +
				'steps=' + computeInstructions.toString() +
				(options.allowUTurns ? '&continue_straight=' + !options.allowUTurns : '');
		},

		_locationKey: function(location) {
			return location.lat + ',' + location.lng;
		},

		_saveHintData: function(actualWaypoints, waypoints) {
			var loc;
			this._hints = {
				locations: {}
			};
			for (var i = actualWaypoints.length - 1; i >= 0; i--) {
				loc = waypoints[i].latLng;
				this._hints.locations[this._locationKey(loc)] = actualWaypoints[i].hint;
			}
		},

		_convertSummary: function(osrmSummary) {
			return {
				totalDistance: osrmSummary.total_distance,
				totalTime: osrmSummary.total_time
			};
		},

		_convertInstructions: function(osrmInstructions) {
			var result = [],
			    i,
			    instr,
			    type,
			    driveDir;

			for (i = 0; i < osrmInstructions.length; i++) {
				instr = osrmInstructions[i];
				type = this._drivingDirectionType(instr[0]);
				driveDir = instr[0].split('-');
				if (type) {
					result.push({
						type: type,
						distance: instr[2],
						time: instr[4],
						road: instr[1],
						direction: instr[6],
						exit: driveDir.length > 1 ? driveDir[1] : undefined,
						index: instr[3]
					});
				}
			}

			return result;
		},
	});

	L.Routing.osrmv1 = function(options) {
		return new L.Routing.OSRM(options);
	};

	module.exports = L.Routing;
})();
