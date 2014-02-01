(function() {
	'use strict';

	L.Routing = L.Routing || {};

	L.Routing.Line = L.Class.extend({
		includes: L.Mixin.Events,

		options: {
			styles: [
				{color: 'red'}
			]
		},

		initialize: function(route, options) {
			L.Util.setOptions(this, options);
			this._route = route;
		},

		addTo: function(map) {
			map.addLayer(this);
		},

		onAdd: function(map) {
			var geom = this._route.geometry,
			    _this = this,
			    i,
			    pl,
			    m;

			this._map = map;
			this._layers = [];
			this._markers = [];
			for (i = 0; i < this.options.styles.length; i++) {
				pl = L.polyline(geom, this.options.styles[i])
					.addTo(map);
				this._layers.push(pl);
			}

			for (i = 0; i < this._route.viaPoints.length; i++) {
				m = L.marker(this._route.viaPoints[i], { draggable: true }).addTo(map);
				(function(i) {
					m.on('dragstart', function(e) {
						this.fire('viadragstart', {index: i, latlng: e.target.getLatLng()});
					}, _this);
					m.on('drag', function(e) {
						this.fire('viadrag', {index: i, latlng: e.target.getLatLng()});
					}, _this);
					m.on('dragend', function(e) {
						this.fire('viadragend', {index: i, latlng: e.target.getLatLng()});
					}, _this);
				})(i);
				this._layers.push(m);
			}
		},

		onRemove: function(map) {
			var i;
			for (i = 0; i < this._layers.length; i++) {
				map.removeLayer(this._layers[i]);
			}

			delete this._map;
		},

		getBounds: function() {
			return L.latLngBounds(this._route.geometry);
		}
	});

	L.Routing.line = function(route, options) {
		return new L.Routing.Line(route, options);
	};
})();
