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
			this._waypoints = [];
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
			this.spliceWaypoints(0, this._waypoints.length, waypoints);
		},

		spliceWaypoints: function() {
			var removed = [].splice.apply(this._waypoints, arguments);

			while (this._waypoints.length < 2) {
				this._waypoints.push(null);
			}

			this._updateMarkers();
			this._fireChanged.apply(this, arguments);
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

		createGeocoders: function() {
			var container = L.DomUtil.create('div', 'leaflet-routing-geocoders'),
				waypoints = this._waypoints,
			    i,
			    geocoderElem,
			    addWpBtn;

			this._geocoderContainer = container;
			this._geocoderElems = [];

			for (i = 0; i < waypoints.length; i++) {
				geocoderElem = this._createGeocoder(i);
				container.appendChild(geocoderElem);
				this._geocoderElems.push(geocoderElem);
			}

			addWpBtn = L.DomUtil.create('button', '', container);
			addWpBtn.type = 'button';
			addWpBtn.innerHTML = '+';
			L.DomEvent.addListener(addWpBtn, 'click', function() {
				this.spliceWaypoints(waypoints.length, 0, null);
			}, this);

			this.on('waypointsspliced', this._updateGeocoders);

			return container;
		},

		_createGeocoder: function(i) {
			var placeholder = (i === 0) ?
			        'Start' : (i >= this._waypoints.length - 1) ?
			        'End' : 'Via',
			    geocoderElem;

			geocoderElem = L.DomUtil.create('input', '');
			geocoderElem.placeholder = placeholder;

			L.DomEvent.addListener(geocoderElem, 'keydown', function(e) {
				var i,
					siblings = geocoderElem.parentElement.children,
					thisIndex = null;

				if (e.keyCode === 13) {
					for (i = 0; i < siblings.length && thisIndex === null; i++) {
						if (siblings[i] === geocoderElem) {
							thisIndex = i;
						}
					}

					this.options.geocoder.geocode(e.target.value, function(results) {
						this.spliceWaypoints(thisIndex, 1, results[0].center);
					}, this);
				}
			}, this);

			return geocoderElem;
		},

		_updateGeocoders: function(e) {
			var newElems = [e.index, 0],
			    i,
			    geocoderElem;
			for (i = 0; i < e.added.length; i++) {
				geocoderElem = this._createGeocoder(e.index + i);
				this._geocoderContainer.insertBefore(geocoderElem, this._geocoderElems[e.index - 1].nextSibling);
				newElems.push(geocoderElem);
			}

			for (i = e.index; i < e.index + e.nRemoved; i++) {
				this._geocoderContainer.removeChild(this._geocoderElems[i]);
			}

			this._geocoderElems.splice(e.index, e.nRemoved);

			[].splice.apply(this._geocoderElems, newElems);
		},

		_setGeocoderValue: function(i, v) {
			this._geocoderElems[i].value = this._geocoderElems[i].value || v;
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

		_fireChanged: function() {
			if (this.isReady()) {
				this.fire('waypointschanged', {waypoints: this._waypoints});
			}
			this.fire('waypointsspliced', {
				index: Array.prototype.shift.call(arguments),
				nRemoved: Array.prototype.shift.call(arguments),
				added: arguments
			});
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
				this.spliceWaypoints(i, 1, e.target.getLatLng());
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
