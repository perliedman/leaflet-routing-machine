(function() {
	'use strict';

	var L = require('leaflet');
	L.Routing = L.Routing || {};
	L.extend(L.Routing, require('./L.Routing.Autocomplete'));
	L.extend(L.Routing, require('./L.Routing.Waypoint'));

	function selectInputText(input) {
		if (input.setSelectionRange) {
			// On iOS, select() doesn't work
			input.setSelectionRange(0, 9999);
		} else {
			// On at least IE8, setSeleectionRange doesn't exist
			input.select();
		}
	}

	L.Routing.Plan = L.Class.extend({
		includes: L.Mixin.Events,

		options: {
			dragStyles: [
				{color: 'black', opacity: 0.15, weight: 9},
				{color: 'white', opacity: 0.8, weight: 6},
				{color: 'red', opacity: 1, weight: 2, dashArray: '7,12'}
			],
			draggableWaypoints: true,
			addWaypoints: true,
			addButtonClassName: '',
			maxGeocoderTolerance: 200,
			autocompleteOptions: {},
			geocodersClassName: '',
			geocoderPlaceholder: function(i, numberWaypoints) {
				return i === 0 ?
					'Start' :
					(i < numberWaypoints - 1 ?
									'Via ' + i :
									'End');
			},
			geocoderClass: function() {
				return '';
			},
			createGeocoder: function() {
				var container = L.DomUtil.create('div', ''),
					input = L.DomUtil.create('input', '', container),
					remove = L.DomUtil.create('span', 'leaflet-routing-remove-waypoint', container);

				return {
					container: container,
					input: input,
					closeButton: remove
				};
			},
			createMarker: function(i, wp, n) {
				var options = {
				      draggable: this.options.draggableWaypoints
				    },
				    marker = L.marker(wp.latLng, options);

				return marker;
			},
			waypointNameFallback: function(latLng) {
				var ns = latLng.lat < 0 ? 'S' : 'N',
				    ew = latLng.lng < 0 ? 'W' : 'E',
				    lat = (Math.round(Math.abs(latLng.lat) * 10000) / 10000).toString(),
				    lng = (Math.round(Math.abs(latLng.lng) * 10000) / 10000).toString();
				return ns + lat + ', ' + ew + lng;
			}
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
			    i,
			    wp;

			for (i = 2; i < arguments.length; i++) {
				args.push(arguments[i] && arguments[i].hasOwnProperty('latLng') ? arguments[i] : L.Routing.waypoint(arguments[i]));
			}

			[].splice.apply(this._waypoints, args);

			while (this._waypoints.length < 2) {
				wp = L.Routing.waypoint();
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
			var container = L.DomUtil.create('div', 'leaflet-routing-geocoders ' + this.options.geocodersClassName),
				waypoints = this._waypoints,
			    i,
			    geocoderElem,
			    addWpBtn;

			this._geocoderContainer = container;
			this._geocoderElems = [];

			for (i = 0; i < waypoints.length; i++) {
				geocoderElem = this._createGeocoder(i);
				container.appendChild(geocoderElem.container);
				this._geocoderElems.push(geocoderElem);
			}

			addWpBtn = L.DomUtil.create('button', this.options.addButtonClassName, container);
			addWpBtn.setAttribute('type', 'button');
			addWpBtn.innerHTML = '+';
			if (this.options.addWaypoints) {
				L.DomEvent.addListener(addWpBtn, 'click', function() {
					this.spliceWaypoints(waypoints.length, 0, null);
				}, this);
			} else {
				addWpBtn.style.display = 'none';
			}

			this.on('waypointsspliced', this._updateGeocoders);

			return container;
		},

		_createGeocoder: function(i) {
			var nWps = this._waypoints.length,
				g = this.options.createGeocoder(i, nWps),
				closeButton = g.closeButton,
				geocoderInput = g.input,
				wp = this._waypoints[i];
			geocoderInput.setAttribute('placeholder', this.options.geocoderPlaceholder(i, nWps));
			geocoderInput.className = this.options.geocoderClass(i, nWps);

			this._updateWaypointName(i, geocoderInput);
			// This has to be here, or geocoder's value will not be properly
			// initialized.
			// TODO: look into why and make _updateWaypointName fix this.
			geocoderInput.value = wp.name;

			L.DomEvent.addListener(geocoderInput, 'click', function() {
				selectInputText(this);
			}, geocoderInput);

			if (closeButton) {
				L.DomEvent.addListener(closeButton, 'click', function() {
					this.spliceWaypoints(i, 1);
				}, this);
			}

			new L.Routing.Autocomplete(geocoderInput, function(r) {
					geocoderInput.value = r.name;
					wp.name = r.name;
					wp.latLng = r.center;
					this._updateMarkers();
					this._fireChanged();
					this._focusGeocoder(i + 1);
				}, this, L.extend({
					resultFn: this.options.geocoder.geocode,
					resultContext: this.options.geocoder,
					autocompleteFn: this.options.geocoder.suggest,
					autocompleteContext: this.options.geocoder
				}, this.options.autocompleteOptions));

			return g;
		},

		_updateGeocoders: function(e) {
			var newElems = [],
			    i,
			    geocoderElem,
			    beforeElem;

			// Determine where to insert geocoders for new waypoints
			if (e.index >= this._geocoderElems.length) {
				// lastChild is the "add new wp" button
				beforeElem = this._geocoderContainer.lastChild;
			} else {
				beforeElem = this._geocoderElems[e.index].container;
			}

			// Insert new geocoders for new waypoints
			for (i = 0; i < e.added.length; i++) {
				geocoderElem = this._createGeocoder(e.index + i);
				this._geocoderContainer.insertBefore(geocoderElem.container, beforeElem);
				newElems.push(geocoderElem);
			}
			//newElems.reverse();

			for (i = e.index; i < e.index + e.nRemoved; i++) {
				this._geocoderContainer.removeChild(this._geocoderElems[i].container);
			}

			newElems.splice(0, 0, e.index, e.nRemoved);
			[].splice.apply(this._geocoderElems, newElems);

			for (i = 0; i < this._geocoderElems.length; i++) {
				this._geocoderElems[i].input.placeholder = this.options.geocoderPlaceholder(i, this._waypoints.length);
				this._geocoderElems[i].input.className = this.options.geocoderClass(i, this._waypoints.length);
			}
		},

		_updateGeocoder: function(i, geocoderElem) {
			var wp = this._waypoints[i],
			    value = wp && wp.name ? wp.name : '';
			if (geocoderElem) {
				geocoderElem.value = value;
			}
		},

		_updateWaypointName: function(i, geocoderElem, force) {
			var wp = this._waypoints[i],
					wpCoords;

			wp.name = wp.name || '';

			if (wp.latLng && (force || !wp.name)) {
				wpCoords = this.options.waypointNameFallback(wp.latLng);
				if (this.options.geocoder && this.options.geocoder.reverse) {
					this.options.geocoder.reverse(wp.latLng, 67108864 /* zoom 18 */, function(rs) {
						if (rs.length > 0 && rs[0].center.distanceTo(wp.latLng) < this.options.maxGeocoderTolerance) {
							wp.name = rs[0].name;
						} else {
							wp.name = wpCoords;
						}
						this._updateGeocoder(i, geocoderElem);
					}, this);
				} else {
					wp.name = wpCoords;
				}

				this._updateGeocoder(i, geocoderElem);
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

			if (!this._map) {
				return;
			}

			this._removeMarkers();

			for (i = 0; i < this._waypoints.length; i++) {
				if (this._waypoints[i].latLng) {
					m = this.options.createMarker(i, this._waypoints[i], this._waypoints.length);
					m.addTo(this._map);
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
				this._waypoints[i].latLng = e.target.getLatLng();
				this.fire('waypointdrag', this._createWaypointEvent(i, e));
			}, this);
			m.on('dragend', function(e) {
				this._waypoints[i].latLng = e.target.getLatLng();
				this._waypoints[i].name = '';
				this._updateWaypointName(i, this._geocoderElems && this._geocoderElems[i].input, true);
				this.fire('waypointdragend', this._createWaypointEvent(i, e));
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
		},

		_focusGeocoder: function(i) {
			var input;
			if (this._geocoderElems[i]) {
				input = this._geocoderElems[i].input;
				input.focus();
				selectInputText(input);
			} else {
				document.activeElement.blur();
			}
		}
	});

	L.Routing.plan = function(waypoints, options) {
		return new L.Routing.Plan(waypoints, options);
	};

	module.exports = L.Routing;
})();
