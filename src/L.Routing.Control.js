(function() {
	'use strict';

	var L = require('leaflet');

	L.Routing = L.Routing || {};
	L.extend(L.Routing, require('./L.Routing.Itinerary'));
	L.extend(L.Routing, require('./L.Routing.Line'));
	L.extend(L.Routing, require('./L.Routing.Plan'));
	L.extend(L.Routing, require('./L.Routing.OSRM'));
	L.extend(L.Routing, require('./L.Routing.GraphHopper'));

	L.Routing.Control = L.Routing.Itinerary.extend({
		options: {
			fitSelectedRoutes: 'smart',
			routeLine: function(route, options) { return L.Routing.line(route, options); },
			autoRoute: true,
			routeWhileDragging: false,
			routeDragInterval: 500,
			waypointMode: 'connect',
			useZoomParameter: false
		},

		initialize: function(options) {
			L.Util.setOptions(this, options);

			this._router = this.options.router || new L.Routing.OSRM(options);
			this._plan = this.options.plan || L.Routing.plan(this.options.waypoints, options);
			this._requestCount = 0;

			L.Routing.Itinerary.prototype.initialize.call(this, options);

			this.on('routeselected', this._routeSelected, this);
			this._plan.on('waypointschanged', this._onWaypointsChanged, this);
			if (options.routeWhileDragging) {
				this._setupRouteDragging();
			}

			if (this.options.autoRoute) {
				this.route();
			}
		},

		onAdd: function(map) {
			var container = L.Routing.Itinerary.prototype.onAdd.call(this, map);

			this._map = map;
			this._map.addLayer(this._plan);

			if (this.options.useZoomParameter) {
				this._map.on('zoomend', function() {
					this.route({
						callback: L.bind(this._updateLineCallback, this)
					});
				}, this);
			}

			if (this._plan.options.geocoder) {
				container.insertBefore(this._plan.createGeocoders(), container.firstChild);
			}

			return container;
		},

		onRemove: function(map) {
			if (this._line) {
				map.removeLayer(this._line);
			}
			map.removeLayer(this._plan);
			return L.Routing.Itinerary.prototype.onRemove.call(this, map);
		},

		getWaypoints: function() {
			return this._plan.getWaypoints();
		},

		setWaypoints: function(waypoints) {
			this._plan.setWaypoints(waypoints);
			return this;
		},

		spliceWaypoints: function() {
			var removed = this._plan.spliceWaypoints.apply(this._plan, arguments);
			return removed;
		},

		getPlan: function() {
			return this._plan;
		},

		getRouter: function() {
			return this._router;
		},

		_routeSelected: function(e) {
			var route = e.route,
				fitMode = this.options.fitSelectedRoutes,
				fitBounds =
					(fitMode === 'smart' && !this._waypointsVisible()) ||
					(fitMode !== 'smart' && fitMode);

			this._updateLine(route);

			if (fitBounds) {
				this._map.fitBounds(this._line.getBounds());
			}

			if (this.options.waypointMode === 'snap') {
				this._plan.off('waypointschanged', this._onWaypointsChanged, this);
				this.setWaypoints(route.waypoints);
				this._plan.on('waypointschanged', this._onWaypointsChanged, this);
			}
		},

		_waypointsVisible: function() {
			var wps = this.getWaypoints(),
				mapSize,
				bounds,
				boundsSize,
				i,
				p;

			try {
				mapSize = this._map.getSize();

				for (i = 0; i < wps.length; i++) {
					p = this._map.latLngToLayerPoint(wps[i].latLng);

					if (bounds) {
						bounds.extend(p);
					} else {
						bounds = L.bounds([p]);
					}
				}

				boundsSize = bounds.getSize();
				return (boundsSize.x > mapSize.x / 5 ||
					boundsSize.y > mapSize.y / 5) && this._waypointsInViewport();
					
			} catch (e) {
				return false;
			}
		},

		_waypointsInViewport: function() {
			var wps = this.getWaypoints(),
				mapBounds,
				i;

			try {
				mapBounds = this._map.getBounds();
			} catch (e) {
				return false;
			}

			for (i = 0; i < wps.length; i++) {
				if (mapBounds.contains(wps[i].latLng)) {
					return true;
				}
			}

			return false;
		},

		_updateLine: function(route) {
			var addWaypoints = this.options.addWaypoints !== undefined ?
				this.options.addWaypoints : true;
			this._clearLine();

			this._line = this.options.routeLine(route,
				L.extend({
					addWaypoints: addWaypoints,
					extendToWaypoints: this.options.waypointMode === 'connect'
				}, this.options.lineOptions));
			this._line.addTo(this._map);
			this._hookEvents(this._line);
		},

		_hookEvents: function(l) {
			l.on('linetouched', function(e) {
				this._plan.dragNewWaypoint(e);
			}, this);
		},

		_onWaypointsChanged: function(e) {
			if (this.options.autoRoute) {
				this.route({});
			}
			if (!this._plan.isReady()) {
				this._clearLine();
				this._clearAlts();
			}
			this.fire('waypointschanged', {waypoints: e.waypoints});
		},

		_setupRouteDragging: function() {
			var timer = 0,
				waypoints;

			this._plan.on('waypointdrag', L.bind(function(e) {
				waypoints = e.waypoints;

				if (!timer) {
					timer = setTimeout(L.bind(function() {
						this.route({
							waypoints: waypoints,
							geometryOnly: true,
							callback: L.bind(this._updateLineCallback, this)
						});
						timer = undefined;
					}, this), this.options.routeDragInterval);
				}
			}, this));
			this._plan.on('waypointdragend', function() {
				if (timer) {
					clearTimeout(timer);
					timer = undefined;
				}
				this.route();
			}, this);
		},

		_updateLineCallback: function(err, routes) {
			if (!err) {
				this._updateLine(routes[0]);
			}
		},

		route: function(options) {
			var ts = ++this._requestCount,
				wps;

			options = options || {};

			if (this._plan.isReady()) {
				if (this.options.useZoomParameter) {
					options.z = this._map && this._map.getZoom();
				}

				wps = options && options.waypoints || this._plan.getWaypoints();
				this.fire('routingstart', {waypoints: wps});
				this._router.route(wps, options.callback || function(err, routes) {
					// Prevent race among multiple requests,
					// by checking the current request's timestamp
					// against the last request's; ignore result if
					// this isn't the latest request.
					if (ts === this._requestCount) {
						this._clearLine();
						this._clearAlts();
						if (err) {
							this.fire('routingerror', {error: err});
							return;
						}

						if (!options.geometryOnly) {
							this.fire('routesfound', {waypoints: wps, routes: routes});
							this.setAlternatives(routes);
						} else {
							this._routeSelected({route: routes[0]});
						}
					}
				}, this, options);
			}
		},

		_clearLine: function() {
			if (this._line) {
				this._map.removeLayer(this._line);
				delete this._line;
			}
		}
	});

	L.Routing.control = function(options) {
		return new L.Routing.Control(options);
	};

	module.exports = L.Routing;
})();
