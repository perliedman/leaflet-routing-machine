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
			dragStyle: 	{color: 'orange', opacity: 1, weight: 3},
			draggableVias: true,
			addVias: true
		},

		initialize: function(route, options) {
			L.Util.setOptions(this, options);
			this._route = route;

			this._viaIndices = this._findViaIndices();
		},

		addTo: function(map) {
			map.addLayer(this);
		},

		onAdd: function(map) {
			var geom = this._route.geometry,
			    i,
			    pl,
			    m;

			this._map = map;
			this._layers = [];
			for (i = 0; i < this.options.styles.length; i++) {
				pl = L.polyline(geom, this.options.styles[i])
					.addTo(map);
				if (this.options.addVias) {
					pl.on('mousedown', this._onLineTouched, this);
				}
				this._layers.push(pl);
			}

			for (i = 0; i < this._route.viaPoints.length; i++) {
				m = L.marker(this._route.viaPoints[i], { draggable: true }).addTo(map);
				if (this.options.draggableVias) {
					this._hookViaEvents(m, i);
				}
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
		},

		_createViaEvent: function(i, e) {
			return {index: i, latlng: e.target.getLatLng()};
		},

		_findViaIndices: function() {
			var vias = this._route.viaPoints,
			    indices = [],
			    i;
			for (i = 0; i < vias.length; i++) {
				indices.push(this._findClosestRoutePoint(L.latLng(vias[i])));
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

		_findNearestViaBefore: function(i) {
			var j = this._viaIndices.length - 1;
			while (j >= 0 && this._viaIndices[j] > i) {
				j--;
			}

			return j;
		},

		_hookViaEvents: function(m, i) {
			m.on('dragstart', function(e) {
				this.fire('viadragstart', this._createViaEvent(i, e));
			}, this);
			m.on('drag', function(e) {
				this.fire('viadrag', this._createViaEvent(i, e));
			}, this);
			m.on('dragend', function(e) {
				this.fire('viadragend', this._createViaEvent(i, e));
			}, this);
		},

		_onLineTouched: function(e) {
			var afterIndex = this._findNearestViaBefore(this._findClosestRoutePoint(e.latlng));

			this._newVia = {
				afterIndex: afterIndex,
				marker: L.marker(e.latlng).addTo(this._map),
				line: L.polyline([
					this._route.viaPoints[afterIndex],
					e.latlng,
					this._route.viaPoints[afterIndex + 1]
				], this.options.dragStyle).addTo(this._map)
			};
			this._layers.push(this._newVia.marker);
			this._layers.push(this._newVia.line);
			this._map.on('mousemove', this._onDragNewVia, this);
			this._map.on('mouseup', this._onViaRelease, this);
		},

		_onDragNewVia: function(e) {
			this._newVia.marker.setLatLng(e.latlng);
			this._newVia.line.spliceLatLngs(1, 1, e.latlng);
		},

		_onViaRelease: function(e) {
			this._map.off('mouseup', this._onViaRelease, this);
			this._map.off('mousemove', this._onViaDrag, this);
			this.fire('viaadded', {
				afterIndex: this._newVia.afterIndex,
				latlng: e.latlng
			});
		}
	});

	L.Routing.line = function(route, options) {
		return new L.Routing.Line(route, options);
	};
})();
