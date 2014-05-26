(function() {
	'use strict';

	var Waypoint = L.Class.extend({
			initialize: function(latLng, name) {
				this.latLng = latLng;
				this.name = name;
			}
		});

	L.Routing = L.Routing || {};

	L.Routing.Plan = L.Class.extend({
		includes: L.Mixin.Events,

		options: {
			dragStyles: [
				{color: 'black', opacity: 0.15, weight: 7},
				{color: 'white', opacity: 0.8, weight: 4},
				{color: 'orange', opacity: 1, weight: 2, dashArray: '7,12'}
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
		},

		spliceWaypoints: function() {
			var args = [arguments[0], arguments[1]],
			    i,
			    wp;

			for (i = 2; i < arguments.length; i++) {
				args.push(arguments[i] && arguments[i].latLng ? arguments[i] : new Waypoint(arguments[i]));
			}

			[].splice.apply(this._waypoints, args);

			while (this._waypoints.length < 2) {
				wp = new Waypoint();
				this._waypoints.push(wp);
				args.push(wp);
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
			addWpBtn.setAttribute('type', 'button');
			addWpBtn.innerHTML = '+';
			L.DomEvent.addListener(addWpBtn, 'click', function() {
				this.spliceWaypoints(waypoints.length, 0, null);
			}, this);

			this.on('waypointsspliced', this._updateGeocoders);

			return container;
		},

		_createGeocoder: function(i) {
			var geocoderElem;

			geocoderElem = L.DomUtil.create('input', '');
			geocoderElem.placeholder = this._geocoderPlaceholder(i);

			this._updateWaypointName(i);

			L.DomEvent.addListener(geocoderElem, 'click', function() {
				this.select();
			}, geocoderElem);

			new L.Routing.Autocomplete(geocoderElem, function(r) {
					geocoderElem.value = r.name;
					this._waypoints[i].name = r.name;
					this._waypoints[i].latLng = r.center;
					this._updateMarkers();
					this._fireChanged();
				}, this, {
					resultFn: this.options.geocoder.geocode,
					resultContext: this.options.geocoder,
					autocompleteFn: this.options.geocoder.suggest,
					autocompleteContext: this.options.geocoder
				});

			return geocoderElem;
		},

		_updateGeocoders: function(e) {
			var newElems = [],
			    i,
			    geocoderElem,
			    beforeElem;
			for (i = e.added.length - 1; i >= 0 ; i--) {
				geocoderElem = this._createGeocoder(e.index + i);
				if (e.index >= this._geocoderElems.length) {
					// lastChild is the "add new wp" button
					beforeElem = this._geocoderContainer.lastChild;
				} else {
					beforeElem = this._geocoderElems[e.index];
				}
				this._geocoderContainer.insertBefore(geocoderElem, beforeElem);
				newElems.push(geocoderElem);
			}
			newElems.reverse();

			for (i = e.index; i < e.index + e.nRemoved; i++) {
				this._geocoderContainer.removeChild(this._geocoderElems[i]);
			}

			newElems.splice(0, 0, e.index, e.nRemoved);
			[].splice.apply(this._geocoderElems, newElems);

			for (i = 0; i < this._geocoderElems.length; i++) {
				this._geocoderElems[i].placeholder = this._geocoderPlaceholder(i);
			}
		},

		_geocoderPlaceholder: function(i) {
			return i === 0 ?
				'Start' :
				(i < this._geocoderElems.length - 1 ?
								'Via ' + i :
								'End');
		},

		_updateWaypointName: function(i, force) {
			var wp = this._waypoints[i];

			function updateGeocoder() {
				var value = wp && wp.name ? wp.name : '';
				if (this._geocoderElems[i]) {
					this._geocoderElems[i].value = value;
				}
			}

			if (wp.latLng && (force || !wp.name)) {
				if (this.options.geocoder && this.options.geocoder.reverse) {
					this.options.geocoder.reverse(wp.latLng, 67108864 /* zoom 18 */, function(rs) {
						if (rs.length > 0 && rs[0].center.distanceTo(wp.latLng) < 200) {
							wp.name = rs[0].name;
						} else {
							wp.name = '';
						}
						updateGeocoder.call(this);
					}, this);
				} else {
					wp.name = '';
				}

				updateGeocoder.call(this);
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
			    icon,
			    options,
			    m;

			if (!this._map) {
				return;
			}

			this._removeMarkers();

			for (i = 0; i < this._waypoints.length; i++) {
				if (this._waypoints[i].latLng) {
					icon = (typeof(this.options.waypointIcon) === 'function') ?
						this.options.waypointIcon(i, this._waypoints[i].name, this._waypoints.length) :
						this.options.waypointIcon;
					options = {
						draggable: true
					};
					if (icon) {
						options.icon = icon;
					}

					m = L.marker(this._waypoints[i].latLng, options).addTo(this._map);
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
			this.fire('waypointschanged', {waypoints: this.getWaypoints()});

			if (arguments.length >= 2) {
				this.fire('waypointsspliced', {
					index: Array.prototype.shift.call(arguments),
					nRemoved: Array.prototype.shift.call(arguments),
					added: arguments
				});
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
				this._waypoints[i].latLng = e.target.getLatLng();
				this._waypoints[i].name = '';
				this._updateWaypointName(i, true);
				this._fireChanged();
			}, this);
		},

		_createWaypointEvent: function(i, e) {
			return {index: i, latlng: e.target.getLatLng()};
		},

		dragNewWaypoint: function(e) {
			var i;
			this._newWp = {
				afterIndex: e.afterIndex,
				marker: L.marker(e.latlng).addTo(this._map),
				lines: []
			};

			for (i = 0; i < this.options.dragStyles.length; i++) {
				this._newWp.lines.push(L.polyline([
					this._waypoints[e.afterIndex].latLng,
					e.latlng,
					this._waypoints[e.afterIndex + 1].latLng
				], this.options.dragStyles[i]).addTo(this._map));
			}

			this._markers.splice(e.afterIndex + 1, 0, this._newWp.marker);
			this._map.on('mousemove', this._onDragNewWp, this);
			this._map.on('mouseup', this._onWpRelease, this);
		},

		_onDragNewWp: function(e) {
			var i;
			this._newWp.marker.setLatLng(e.latlng);
			for (i = 0; i < this._newWp.lines.length; i++) {
				this._newWp.lines[i].spliceLatLngs(1, 1, e.latlng);
			}
		},

		_onWpRelease: function(e) {
			var i;
			this._map.off('mouseup', this._onWpRelease, this);
			this._map.off('mousemove', this._onDragNewWp, this);
			for (i = 0; i < this._newWp.lines.length; i++) {
				this._map.removeLayer(this._newWp.lines[i]);
			}
			this.spliceWaypoints(this._newWp.afterIndex + 1, 0, e.latlng);
			delete this._newWp;
		}
	});

	L.Routing.plan = function(waypoints, options) {
		return new L.Routing.Plan(waypoints, options);
	};
})();
