var L = require('leaflet');

module.exports = L.LayerGroup.extend({
	options: {
		modifyWaypoints: true,
		createMarker: function(i, wp) {
			var options = {
					draggable: this.modifyWaypoints
				},
			    marker = L.marker(wp.latLng, options);

			return marker;
		}
	},

	initialize: function(plan, options) {
		L.setOptions(this, options);
		L.LayerGroup.prototype.initialize.call(this);
		plan.on('waypointschanged', this._updateMarkers, this);
		this._plan = plan;
		this._updateMarkers({ waypoints: this._plan.getWaypoints() });
	},

	onAdd: function(map) {
		L.LayerGroup.prototype.onAdd.call(this, map);

		this._map = map;
	},

	onRemove: function(map) {
		var i;
		L.LayerGroup.prototype.onRemove.call(this, map);

		if (this._newWp) {
			for (i = 0; i < this._newWp.lines.length; i++) {
				this._map.removeLayer(this._newWp.lines[i]);
			}
		}
	},

	_updateMarkers: function(e) {
		var wps = e.waypoints,
			marker,
			i;
		this.clearLayers();
		this._markers = [];

		for (i = 0; i < wps.length; i++) {
			marker = this.options.createMarker.call(this.options, i, wps[i]);
			if (marker) {
				this.addLayer(marker);
				this._hookWaypointEvents(wps[i], marker, i, false);
				this._markers.push(marker);
			}
		}
	},

	_hookWaypointEvents: function(wp, m, i, trackMouseMove) {
		var eventLatLng = function(e) {
				return trackMouseMove ? e.latlng : e.target.getLatLng();
			},
			dragStart = L.bind(function(e) {
				this.fire('waypointdragstart', {index: i, latlng: eventLatLng(e)});
			}, this),
			drag = L.bind(function(e) {
				wp.latLng = eventLatLng(e);
				this.fire('waypointdrag', {index: i, latlng: eventLatLng(e)});
			}, this),
			dragEnd = L.bind(function(e) {
				var latLng = eventLatLng(e);
				wp.latLng = latLng;
				wp.name = '';
				if (this._geocoderElems) {
					this._geocoderElems[i].update(true);
				}
				this.fire('waypointdragend', {index: i, latlng: latLng});
				this._plan.spliceWaypoints(i, 1, latLng);
			}, this),
			mouseMove,
			mouseUp;

		if (trackMouseMove) {
			mouseMove = L.bind(function(e) {
				this._markers[i].setLatLng(e.latlng);
				drag(e);
			}, this);
			mouseUp = L.bind(function(e) {
				this._map.dragging.enable();
				this._map.off('mouseup', mouseUp);
				this._map.off('mousemove', mouseMove);
				dragEnd(e);
			}, this);
			this._map.dragging.disable();
			this._map.on('mousemove', mouseMove);
			this._map.on('mouseup', mouseUp);
			dragStart({latlng: wp.latLng});
		} else {
			m.on('dragstart', dragStart);
			m.on('drag', drag);
			m.on('dragend', dragEnd);
		}
	},

	dragNewWaypoint: function(e) {
		var newWpIndex = e.afterIndex + 1;
		if (this.options.routeWhileDragging) {
			this._plan.spliceWaypoints(newWpIndex, 0, e.latlng);
			this._hookWaypointEvents(this._markers[newWpIndex], newWpIndex, true);
		} else {
			this._dragNewWaypoint(newWpIndex, e.latlng);
		}
	},

	_dragNewWaypoint: function(newWpIndex, initialLatLng) {
		var wp = new Waypoint(initialLatLng),
			wps = this._plan.getWaypoints(),
			prevWp = wps[newWpIndex - 1],
			nextWp = wps[newWpIndex],
			marker = this.options.createMarker(newWpIndex, wp, wps.length + 1),
			lines = [],
			mouseMove = L.bind(function(e) {
				var i;
				if (marker) {
					marker.setLatLng(e.latlng);
				}
				for (i = 0; i < lines.length; i++) {
					lines[i].spliceLatLngs(1, 1, e.latlng);
				}
			}, this),
			mouseUp = L.bind(function(e) {
				var i;
				if (marker) {
					this._map.removeLayer(marker);
				}
				for (i = 0; i < lines.length; i++) {
					this._map.removeLayer(lines[i]);
				}
				this._map.off('mousemove', mouseMove);
				this._map.off('mouseup', mouseUp);
				this._plan.spliceWaypoints(newWpIndex, 0, e.latlng);
			}, this),
			i;

		if (marker) {
			marker.addTo(this._map);
		}

		for (i = 0; i < this.options.dragStyles.length; i++) {
			lines.push(L.polyline([prevWp.latLng, initialLatLng, nextWp.latLng],
				this.options.dragStyles[i]).addTo(this._map));
		}

		this._map.on('mousemove', mouseMove);
		this._map.on('mouseup', mouseUp);
	},
});
