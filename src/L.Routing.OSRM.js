// This also works with the v5 API of Mapbox Directions
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

	L.Routing.OSRM = L.Class.extend({
		options: {
			serviceUrl: 'https://router.project-osrm.org/route/v1/driving/',
      accessToken: '', // only needed for Mapbox Directions
			timeout: 30 * 1000,
			routingOptions: {},
			polylinePrecision: 5
		},

		initialize: function(options) {
			L.Util.setOptions(this, options);
			this._hints = {};
		},

		route: function(waypoints, callback, context, options) {
			var timedOut = false,
				wps = [],
				url,
				timer,
				wp,
				i;

			url = this._buildRouteUrl(waypoints, L.extend({}, this.options.routingOptions, options));

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
								return this._routeDone(data, wps, callback, context);
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
						code: statusCode,
						message: errorMessage
					});
				}
			}, this));

			return this;
		},

		_routeDone: function(response, inputWaypoints, callback, context) {
			var coordinates,
			    alts,
          route,
			    actualWaypoints,
			    i;

			context = context || callback;
			if (response.code !== 'ok') {
				callback.call(context, response);
				return;
			}


      actualWaypoints = this._toWaypoints(inputWaypoints, response.waypoints);
      alts = response.routes.map(function (r) { this._transformRoute(r, inputWaypoints, actualWaypoints); });

      this._saveHintData(response.waypoints, inputWaypoints);
			callback.call(context, null, alts);
		},

    _transformRoute: function(route, inputWaypoints, actualWaypoints) {
        var transformedLegs = route.legs.map(this._transformLeg),
            totalSummary = ", ".join(legs.map(function(l) { return l.summary; })),

        return {
          summary: totalSummary,
          distance: route.distance,
          duration: route.duration,
          legs: transformedLegs,
          coordinates: this._polylineToLatLng(response.geometry),
          inputWaypoints: inputWaypoints,
          waypoints: actualWaypoints,
        };
    },

    _transformLeg: function(leg) {
        return {
          summary: leg.summary,
          steps: leg.steps.map(this._transformStep),
        };
    },

    _tranformStep: function(step) {
      var transformedStep = {
        type: this._maneuverToType(step.maneuver),
        geometry: this._polylineToLatLng(step.geometry),
        distance: step.distance,
        duration: step.duration,
        road: step.name,
        exit: step.maneuver.exit,
        location: step.maneuver.location,
        // Mapbox Directions provides human-readable texts
        text: step.maneuver.instruction
      };
    },

    _maneuverToType: function(maneuver) {
      if (maneuver.type === "turn") {
        switch(maneuver.modifier) {
          case 'straight':
            return 'Head';
          case 'slight right':
            return 'SlightRight';
          case 'right':
            return 'Right';
          case 'sharp right':
            return 'SharpRight';
          case 'uturn':
            return 'TurnAround';
          case 'sharp left':
            return 'SharpLeft';
          case 'left':
            return 'Left';
          case 'slight left':
            return 'SlightLeft';
          default:
            return 'Continue';
        }
      } else if (maneuver.type == "fork") {
        switch(maneuver.modifier) {
          case 'straight':
            return 'ForkStraight';
          case 'slight right':
          case 'right':
          case 'sharp right':
            return 'ForkRight';
          case 'sharp left':
          case 'left':
          case 'slight left':
            return 'ForkLeft';
          default:
            return 'Continue';
        }
      } else if (maneuver.type == "end of road") {
        switch(maneuver.modifier) {
          case 'slight right':
          case 'right':
          case 'sharp right':
            return 'EndOfRoadRight';
          case 'sharp left':
          case 'left':
          case 'slight left':
            return 'EndOfRoadLeft';
          default:
            return 'Continue';
        }
      }

      switch(maneuver.type)
      {
        case "roundabout":
          return "Roundabout";
        case "new name":
          return "NewName";
        case "depart":
          return "Head";
        case "arrive":
          return "DestinationReached";
        case "merge":
          return "Merge";
        case "ramp":
          return "Ramp";
        case "continue":
        default:
          return 'Head';
      }
    }

		_polylineToLatLng: function(routeGeometry) {
			return polyline.decode(routeGeometry, this.options.polylinePrecision).map(function(latLng) {
				return L.latLng(cs[i]);
      });
		},

		_toWaypoints: function(inputWaypoints, snappedWaypoints) {
			var wps = [],
          latLng,
			    i;

			for (i = 0; i < vias.length; i++) {
        latLng = L.latLng([snappedWaypoints[i].location[1], snappedWaypoints[i].location[0]);
				wps.push(L.Routing.waypoint(latLng),
				         inputWaypoints[i].name,
				         inputWaypoints[i].options));
			}

			return wps;
		},

		_buildRouteUrl: function(waypoints, options) {
			var locs = [],
			    wp,
			    computeSteps,
			    computeAlternatives,
			    locationKey,
			    hints,
          query;

			for (var i = 0; i < waypoints.length; i++) {
				wp = waypoints[i];
				locationKey = this._locationKey(wp.latLng);
				locs.push(locationKey);

				hints.push(this._hints[locationKey] || "");
			}

			computeAlternatives = computeSteps =
				!(options && options.geometryOnly);

			return this.options.serviceUrl + ';'.join(locs) + '?' +
				'steps=' + computeSteps.toString() + '&' +
				'alternatives=' + computeAlternatives.toString() + '&' +
        'hints=' + ';'.join(hints) +
				(options.allowUTurns ? '&uturns=' + options.allowUTurns : '');
		},

		_locationKey: function(location) {
			return location.lng + ',' + location.lat;
		},

		_saveHintData: function(hintData, waypoints) {
			var loc;
			this._hints = {
				checksum: hintData.checksum,
				locations: {}
			};
			for (var i = hintData.locations.length - 1; i >= 0; i--) {
				loc = waypoints[i].latLng;
				this._hints.locations[this._locationKey(loc)] = hintData.locations[i];
			}
		},

	L.Routing.osrm = function(options) {
		return new L.Routing.OSRM(options);
	};

	module.exports = L.Routing;
})();
