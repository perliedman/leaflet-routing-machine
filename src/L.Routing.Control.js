(function() {
	'use strict';

	L.Routing.Control = L.Routing.Itinerary.extend({
		options: {
			fitSelectedRoutes: true,
			routeLine: function(route, options) { return L.Routing.line(route, options); },
			autoRoute: true,
			routeWhileDragging: false
		},

		initialize: function(options) {
			L.Util.setOptions(this, options);

			this._router = this.options.router || new L.Routing.OSRM(options);
			this._plan = this.options.plan || L.Routing.plan(this.options.waypoints, options);

			L.Routing.Itinerary.prototype.initialize.call(this, options);

			this.on('routeselected', this._routeSelected, this);
			this._plan.on('waypointschanged', function(e) {
				if (this.options.autoRoute) {
					this.route({});
				}
				this.fire('waypointschanged', {waypoints: e.waypoints});
			}, this);
			if (options.routeWhileDragging)
			{
				this._plan.on('waypointdrag', function(e) {
						this.route({waypoints: e.waypoints, geometryOnly: true});
				}, this);
			}

			if (this.options.autoRoute) {
				this.route({});
			}
		},

		onAdd: function(map) {
			var container = L.Routing.Itinerary.prototype.onAdd.call(this, map);

			this._map = map;
			this._map.addLayer(this._plan);

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

		_routeSelected: function(e) {
			var route = e.route;
			this._clearLine();

			this._line = this.options.routeLine(route, this.options.lineOptions);
			this._line.addTo(this._map);
			this._hookEvents(this._line);

			if (this.options.fitSelectedRoutes) {
				this._map.fitBounds(this._line.getBounds());
			}
		},

		_hookEvents: function(l) {
			l.on('linetouched', function(e) {
				this._plan.dragNewWaypoint(e);
			}, this);
		},

		route: function(options) {
			var ts = new Date().getTime(),
				wps;

			this._lastRequestTimestamp = ts;

			if (this._plan.isReady()) {
				wps = options.waypoints || this._plan.getWaypoints();
				this.fire('routingstart', {waypoints: wps});
				this._router.route(wps, options, function(err, routes) {
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
						this.fire('routesfound', {waypoints: wps, routes: routes});
						this.setAlternatives(routes);
					}
				}, this);
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
