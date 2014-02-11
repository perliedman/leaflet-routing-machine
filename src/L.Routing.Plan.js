(function() {
	'use strict';

	L.Routing = L.Routing || {};

	L.Routing.Plan = L.Class.extend({
		includes: L.Mixin.Events,

		options: {
			styles: [
				{color: 'black', opacity: 0.15, weight: 7},
				{color: 'white', opacity: 0.8, weight: 4},
				{color: 'orange', opacity: 1, weight: 2}
			],
			draggableWaypoints: true,
			addWaypoints: true
		},

		initialize: function(waypoints, options) {
			L.Util.setOptions(this, options);
			this.setWaypoints(waypoints);
		},

		isReady: function() {
			var i;
			for (i = 0; i < this._waypoints.length; i++) {
				if (!this._waypoints[i]) {
					return false;
				}
			}

			return true;
		},

		getWaypoints: function() {
			return this._waypoints;
		},

		setWaypoints: function(waypoints) {
			this._waypoints = waypoints || [];
			while (this._waypoints.length < 2) {
				this._waypoints.push(null);
			}
			this._updateMarkers();
			this._fireChangedIfReady();
		},

		spliceWaypoints: function() {
			var removed = [].splice.apply(this._waypoints, arguments);
			this._updateMarkers();
			this._fireChangedIfReady();
			return removed;
		},

		onAdd: function(map) {
			this._map = map;
			this._updateMarkers();
		},

		onRemove: function() {
			this._removeMarkers();

			if (this._newWp) {
				this._map.removeLayer(this._newWp.line);
			}
		},

		_removeMarkers: function() {
			var i;
			if (this._markers) {
				for (i = 0; i < this._markers.length; i++) {
					if (this._markers[i]) {
						this._map.removeLayer(this._markers[i]);
					}
				}
			}
			this._markers = [];
		},

		_updateMarkers: function() {
			var i,
			    m;
			this._removeMarkers();

			for (i = 0; i < this._waypoints.length; i++) {
				if (this._waypoints[i]) {
					m = L.marker(this._waypoints[i], { draggable: true }).addTo(this._map);
					if (this.options.draggableWaypoints) {
						this._hookWaypointEvents(m, i);
					}
				} else {
					m = null;
				}
				this._markers.push(m);
			}
		},

		_fireChangedIfReady: function() {
			if (this.isReady()) {
				this.fire('waypointschanged', {waypoints: this._waypoints});
			}
		},

		_hookWaypointEvents: function(m, i) {
			m.on('dragstart', function(e) {
				this.fire('waypointdragstart', this._createWaypointEvent(i, e));
			}, this);
			m.on('drag', function(e) {
				this.fire('waypointdrag', this._createWaypointEvent(i, e));
			}, this);
			m.on('dragend', function(e) {
				this.fire('waypointdragend', this._createWaypointEvent(i, e));
				this.spliceWaypoints(i, 0, e.latlng);
			}, this);
		},

		_createWaypointEvent: function(i, e) {
			return {index: i, latlng: e.target.getLatLng()};
		},

		dragNewWaypoint: function(e) {
			this._newWp = {
				afterIndex: e.afterIndex,
				marker: L.marker(e.latlng).addTo(this._map),
				line: L.polyline([
					this._waypoints[e.afterIndex],
					e.latlng,
					this._waypoints[e.afterIndex + 1]
				], this.options.dragStyle).addTo(this._map)
			};
			this._markers.splice(e.afterIndex + 1, 0, this._newWp.marker);
			this._map.on('mousemove', this._onDragNewWp, this);
			this._map.on('mouseup', this._onWpRelease, this);
		},

		_onDragNewWp: function(e) {
			this._newWp.marker.setLatLng(e.latlng);
			this._newWp.line.spliceLatLngs(1, 1, e.latlng);
		},

		_onWpRelease: function(e) {
			this._map.off('mouseup', this._onWpRelease, this);
			this._map.off('mousemove', this._onDragNewWp, this);
			this._map.removeLayer(this._newWp.line);
			this.spliceWaypoints(this._newWp.afterIndex + 1, 0, e.latlng);
			delete this._newWp;
		}
	});

	L.Routing.plan = function(waypoints, options) {
		return new L.Routing.Plan(waypoints, options);
	};
})();
