(function() {
	'use strict';

	L.Routing.Control = L.Routing.Itinerary.extend({
		options: {
		},

		initialize: function(options) {
			L.Util.setOptions(this, options);

			this._router = this.options.router || new L.Routing.OSRM();
			this._vias = this.options.vias || [];

			L.Routing.Itinerary.prototype.initialize.call(this, this._router);

			this.on('routeselected', this._routeSelected, this);

			if (this._vias) {
				this._router.route(this._vias);
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

		setVias: function(vias) {
			this._vias = vias;
			this._router.route(vias);
		},

		spliceVias: function() {
			var removed = [].splice.apply(this._vias, arguments);
			this._router.route(this._vias);
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
			var vias = this._vias,
			    _this = this,
				t;

			l.on('viadrag', function(e) {
				vias[e.index] = e.latlng;
				if (t) {
					clearTimeout(t);
				}
				t = setTimeout(function() {
					_this._router.route(vias);
				}, 1000);
			});

			l.on('viaadded', function(e) {
				this.spliceVias(e.afterIndex + 1, 0, e.latlng);
			}, this);
		}
	});

	L.Routing.control = function(options) {
		return new L.Routing.Control(options);
	};
})();
