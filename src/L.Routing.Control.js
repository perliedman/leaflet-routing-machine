(function() {
	'use strict';

	L.Routing.Control = L.Routing.Itinerary.extend({
		options: {
			fitSelectedRoutes: true
		},

		initialize: function(options) {
			L.Util.setOptions(this, options);

			this._router = this.options.router || new L.Routing.OSRM();
			this._plan = this.options.plan || L.Routing.plan(undefined, { geocoder: this.options.geocoder });
			if (this.options.geocoder) {
				this._plan.options.geocoder = this.options.geocoder;
			}
			if (this.options.waypoints) {
				this._plan.setWaypoints(this.options.waypoints);
			}

			L.Routing.Itinerary.prototype.initialize.call(this, options);

			this.on('routeselected', this._routeSelected, this);
			this._plan.on('waypointschanged', function(e) {
				this._route();
				this.fire('waypointschanged', {waypoints: e.waypoints});
			}, this);

			this._route();
		},

		onAdd: function(map) {
			var container = L.Routing.Itinerary.prototype.onAdd.call(this, map);

			this._map = map;
			this._map.addLayer(this._plan);

			if (this.options.geocoder) {
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

			this._line = L.Routing.line(route, this.options.lineOptions);
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

		_route: function() {
			var wps;

			this._clearLine();
			this._clearAlts();

			if (this._plan.isReady()) {
				wps = this._plan.getWaypoints();
				this.fire('routingstart', {waypoints: wps});
				this._router.route(wps, function(err, routes) {
					if (err) {
						this.fire('routingerror', {error: err});
						return;
					}
					this.fire('routesfound', {waypoints: wps, routes: routes});
					this.setAlternatives(routes);
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
