(function() {
	'use strict';

	L.Routing.Control = L.Routing.Itinerary.extend({
		options: {
			fitSelectedRoutes: true,
			routeLine: function(route, options) { return L.Routing.line(route, options); },
			autoRoute: true,
			routeWhileDragging: false,
			routeDragInterval: 500,
			waypointMode: 'connect'
		},

		// used to temporary overide options, e.g. fitSelectedRoutes while dragging
		_optionsOverride : {
		},

		initialize: function(options) {
			L.Util.setOptions(this, options);

			this._router = this.options.router || new L.Routing.OSRM(options);
			this._plan = this.options.plan || L.Routing.plan(this.options.waypoints, options);

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
			this._map.on('zoomend', function() {
				this._optionsOverride.fitSelectedRoutes = false;
				this.route();
			}, this);

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

		_override: function(defaultValue, overrideValue) {
			if (typeof(overrideValue) !== 'undefined')
			{
				return overrideValue;
			}
			return defaultValue;
		},

		_routeSelected: function(e) {
			var route = e.route,
			    fitSelectedRoutes = this._override(this.options.fitSelectedRoutes,
			                                       this._optionsOverride.fitSelectedRoutes),
			    waypointMode = this._override(this.options.waypointMode,
			                                  this._optionsOverride.waypointMode);

			this._clearLine();

			this._line = this.options.routeLine(route,
				L.extend({extendToWaypoints: waypointMode === 'connect'},
					this.options.lineOptions));
			this._line.addTo(this._map);
			this._hookEvents(this._line);

			if (fitSelectedRoutes) {
				this._map.fitBounds(this._line.getBounds());
			}

			if (waypointMode === 'snap') {
				this._plan.off('waypointschanged', this._onWaypointsChanged, this);
				this.setWaypoints(route.waypoints);
				this._plan.on('waypointschanged', this._onWaypointsChanged, this);
			}

			this._optionsOverride.fitSelectedRoutes = undefined;
			this._optionsOverride.waypointMode = undefined;
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
			this.fire('waypointschanged', {waypoints: e.waypoints});
		},

		_setupRouteDragging: function() {
			var lastCalled = 0;

			this._plan.on('waypointdrag', L.bind(function(e) {
				var now = new Date().getTime();
				if (now - lastCalled >= this.options.routeDragInterval) {
					this._optionsOverride.fitSelectedRoutes = false;
					this._optionsOverride.waypointMode = 'connect';
					this.route({waypoints: e.waypoints, geometryOnly: true});
					lastCalled = now;
				}
			}, this));
			this._plan.on('waypointdragend', function() {
				this._optionsOverride.fitSelectedRoutes = undefined;
				this._optionsOverride.waypointMode = undefined;
				this.route();
			}, this);
		},

		route: function(options) {
			var ts = new Date().getTime(),
				wps;

			options = options || {};
			this._lastRequestTimestamp = ts;

			if (this._plan.isReady()) {
				options.z = this._map.getZoom();
				wps = options && options.waypoints || this._plan.getWaypoints();
				this.fire('routingstart', {waypoints: wps});
				this._router.route(wps, function(err, routes) {
					// Prevent race among multiple requests,
					// by checking the current request's timestamp
					// against the last request's; ignore result if
					// this isn't the latest request.
					if (ts === this._lastRequestTimestamp) {
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
})();
