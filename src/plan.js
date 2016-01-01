'use strict';

var L = require('leaflet'),
	GeocoderElement = require('./geocoder-element'),
	Waypoint = require('./waypoint');

module.exports = L.Layer.extend({
	includes: L.Mixin.Events,

	options: {
		dragStyles: [
			{color: 'black', opacity: 0.15, weight: 9},
			{color: 'white', opacity: 0.8, weight: 6},
			{color: 'red', opacity: 1, weight: 2, dashArray: '7,12'}
		],
		draggableWaypoints: true,
		routeWhileDragging: false,
		createMarker: function(i, wp) {
			var options = {
					draggable: this.draggableWaypoints
				},
			    marker = L.marker(wp.latLng, options);

			return marker;
		},
		geocodersClassName: ''
	},

	initialize: function(waypoints, options) {
		L.Util.setOptions(this, options);
		this._waypoints = [];
		this.setWaypoints(waypoints);
	},

	isReady: function() {
		var i;
		for (i = 0; i < this._waypoints.length; i++) {
			if (!this._waypoints[i].latLng) {
				return false;
			}
		}

		return true;
	},

	getWaypoints: function() {
		var i,
			wps = [];

		for (i = 0; i < this._waypoints.length; i++) {
			wps.push(this._waypoints[i]);
		}

		return wps;
	},

	setWaypoints: function(waypoints) {
		var args = [0, this._waypoints.length].concat(waypoints);
		this.spliceWaypoints.apply(this, args);
		return this;
	},

	spliceWaypoints: function() {
		var args = [arguments[0], arguments[1]],
		    i;

		for (i = 2; i < arguments.length; i++) {
			args.push(arguments[i] && arguments[i].hasOwnProperty('latLng') ? arguments[i] : new Waypoint(arguments[i]));
		}

		[].splice.apply(this._waypoints, args);

		// Make sure there's always at least two waypoints
		while (this._waypoints.length < 2) {
			this.spliceWaypoints(this._waypoints.length, 0, null);
		}

		this._updateMarkers();
		this._fireChanged.apply(this, args);
	},

	onAdd: function(map) {
		this._map = map;
		this._updateMarkers();
	},

	onRemove: function() {
		var i;
		this._removeMarkers();

		if (this._newWp) {
			for (i = 0; i < this._newWp.lines.length; i++) {
				this._map.removeLayer(this._newWp.lines[i]);
			}
		}

		delete this._map;
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

		if (!this._map) {
			return;
		}

		this._removeMarkers();

		for (i = 0; i < this._waypoints.length; i++) {
			if (this._waypoints[i].latLng) {
				m = this.options.createMarker(i, this._waypoints[i], this._waypoints.length);
				if (m) {
					m.addTo(this._map);
					if (this.options.draggableWaypoints) {
						this._hookWaypointEvents(m, i);
					}
				}
			} else {
				m = null;
			}
			this._markers.push(m);
		}
	},

	_fireChanged: function() {
		this.fire('waypointschanged', {waypoints: this.getWaypoints()});

		if (arguments.length >= 2) {
			this.fire('waypointsspliced', {
				index: Array.prototype.shift.call(arguments),
				nRemoved: Array.prototype.shift.call(arguments),
				added: arguments
			});
		}
	},

	_hookWaypointEvents: function(m, i, trackMouseMove) {
		var eventLatLng = function(e) {
				return trackMouseMove ? e.latlng : e.target.getLatLng();
			},
			dragStart = L.bind(function(e) {
				this.fire('waypointdragstart', {index: i, latlng: eventLatLng(e)});
			}, this),
			drag = L.bind(function(e) {
				this._waypoints[i].latLng = eventLatLng(e);
				this.fire('waypointdrag', {index: i, latlng: eventLatLng(e)});
			}, this),
			dragEnd = L.bind(function(e) {
				this._waypoints[i].latLng = eventLatLng(e);
				this._waypoints[i].name = '';
				if (this._geocoderElems) {
					this._geocoderElems[i].update(true);
				}
				this.fire('waypointdragend', {index: i, latlng: eventLatLng(e)});
				this._fireChanged();
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
			dragStart({latlng: this._waypoints[i].latLng});
		} else {
			m.on('dragstart', dragStart);
			m.on('drag', drag);
			m.on('dragend', dragEnd);
		}
	},

	dragNewWaypoint: function(e) {
		var newWpIndex = e.afterIndex + 1;
		if (this.options.routeWhileDragging) {
			this.spliceWaypoints(newWpIndex, 0, e.latlng);
			this._hookWaypointEvents(this._markers[newWpIndex], newWpIndex, true);
		} else {
			this._dragNewWaypoint(newWpIndex, e.latlng);
		}
	},

	_dragNewWaypoint: function(newWpIndex, initialLatLng) {
		var wp = new Waypoint(initialLatLng),
			prevWp = this._waypoints[newWpIndex - 1],
			nextWp = this._waypoints[newWpIndex],
			marker = this.options.createMarker(newWpIndex, wp, this._waypoints.length + 1),
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
				this.spliceWaypoints(newWpIndex, 0, e.latlng);
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
	}
});
