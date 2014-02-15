(function() {
	'use strict';

	L.Routing = L.Routing || {};

	L.Routing.Line = L.Class.extend({
		includes: L.Mixin.Events,

		options: {
			styles: [
				{color: 'black', opacity: 0.15, weight: 7},
				{color: 'white', opacity: 0.8, weight: 4},
				{color: 'orange', opacity: 1, weight: 2}
			],
			addWaypoints: true
		},

		initialize: function(route, options) {
			L.Util.setOptions(this, options);
			this._route = route;

			this._wpIndices = this._findWaypointIndices();
		},

		addTo: function(map) {
			map.addLayer(this);
		},

		onAdd: function(map) {
			var geom = this._route.geometry,
			    i,
			    pl;

			this._map = map;
			this._layers = [];
			for (i = 0; i < this.options.styles.length; i++) {
				pl = L.polyline(geom, this.options.styles[i])
					.addTo(map);
				if (this.options.addWaypoints) {
					pl.on('mousedown', this._onLineTouched, this);
				}
				this._layers.push(pl);
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
		},

		_findWaypointIndices: function() {
			var wps = this._route.waypoints,
			    indices = [],
			    i;
			for (i = 0; i < wps.length; i++) {
				indices.push(this._findClosestRoutePoint(L.latLng(wps[i])));
			}

			return indices;
		},

		_findClosestRoutePoint: function(latlng) {
			var minDist = Number.MAX_VALUE,
				minIndex,
			    i,
			    d;

			for (i = this._route.geometry.length - 1; i >= 0 ; i--) {
				// TODO: maybe do this in pixel space instead?
				d = latlng.distanceTo(this._route.geometry[i]);
				if (d < minDist) {
					minIndex = i;
					minDist = d;
				}
			}

			return minIndex;
		},

		_findNearestWpBefore: function(i) {
			var j = this._wpIndices.length - 1;
			while (j >= 0 && this._wpIndices[j] > i) {
				j--;
			}

			return j;
		},

		_onLineTouched: function(e) {
			var afterIndex = this._findNearestWpBefore(this._findClosestRoutePoint(e.latlng));
			this.fire('linetouched', {
				afterIndex: afterIndex,
				latlng: e.latlng
			});
		},
	});

	L.Routing.line = function(route, options) {
		return new L.Routing.Line(route, options);
	};
})();
