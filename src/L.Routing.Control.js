(function() {
	'use strict';

	L.Routing.Control = L.Routing.Itinerary.extend({
		options: {
		},

		initialize: function(options) {
			L.Util.setOptions(this, options);

			this._router = this.options.router || new L.Routing.OSRM();
			this._waypoints = this.options.waypoints || [];

			L.Routing.Itinerary.prototype.initialize.call(this, this._router);

			this.on('routeselected', this._routeSelected, this);

			if (this._waypoints) {
				this._router.route(this._waypoints);
			}
		},

		onAdd: function(map) {
			this._map = map;
			return L.Routing.Itinerary.prototype.onAdd.call(this, map);
		},

		onRemove: function(map) {
			if (this._line) {
				map.removeLayer(this._line);
			}
			return L.Routing.Itinerary.prototype.onRemove.call(this, map);
		},

		setVias: function(waypoints) {
			this._waypoints = waypoints;
			this._router.route(waypoints);
		},

		spliceVias: function() {
			var removed = [].splice.apply(this._waypoints, arguments);
			this._router.route(this._waypoints);
			return removed;
		},

		_routeSelected: function(e) {
			var route = e.route;

			if (this._line) {
				this._map.removeLayer(this._line);
			}

			this._line = L.Routing.line(route);
			this._line.addTo(this._map);
			this._map.fitBounds(this._line.getBounds());

			this._hookEvents(this._line);
		},

		_hookEvents: function(l) {
			var wps = this._waypoints,
			    _this = this,
				t;

			l.on('waypointdrag', function(e) {
				wps[e.index] = e.latlng;
				if (t) {
					clearTimeout(t);
				}
				t = setTimeout(function() {
					_this._router.route(wps);
				}, 1000);
			});

			l.on('waypointadded', function(e) {
				this.spliceVias(e.afterIndex + 1, 0, e.latlng);
			}, this);
		}
	});

	L.Routing.control = function(options) {
		return new L.Routing.Control(options);
	};
})();
