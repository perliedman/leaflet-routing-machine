(function() {
	'use strict';

	var Waypoint = L.Class.extend({
			initialize: function(latLng, name) {
				this.latLng = latLng;
				this.name = name;
			}
		}),
	    GeocoderResults = L.Class.extend({
			initialize: function(results) {
				this._results = results;
			},

			addTo: function(elem) {
				var container = L.DomUtil.create('table', 'leaflet-routing-geocoder-result'),
					sibling = elem.nextSibling,
				    i,
				    tr,
				    td;

				this._elem = elem;

				for (i = 0; i < this._results.length; i++) {
					tr = L.DomUtil.create('tr', '', container);
					tr.setAttribute('data-result-index', i);
					td = L.DomUtil.create('td', '', tr);
					td.textContent = this._results[i].name;
					L.DomEvent.addListener(td, 'click', this._listener(this._results[i]), this);
				}

				L.DomEvent.addListener(elem, 'keydown', this._keyPressed, this);

				container.style.left = elem.offsetLeft;
				container.style.top = elem.offsetTop + elem.offsetHeight;
				container.style.width = elem.offsetWidth;

				if (sibling) {
					elem.parentElement.insertBefore(container, sibling);
				} else {
					elem.parentElement.appendChild(container);
				}

				this._container = container;

				return this;
			},

			onResultSelected: function() {},

			_listener: function(r) {
				return function() {
					this.onResultSelected(r);
				};
			},

			_keyPressed: function(e) {
				var _this = this,
					select = function select(dir) {
						if (_this._selection) {
							L.DomUtil.removeClass(_this._selection.firstChild, 'leaflet-routing-geocoder-selected');
							_this._selection = _this._selection[dir > 0 ? 'nextSibling' : 'previousSibling'];
						}
						if (!_this._selection) {
							_this._selection = _this._container[dir > 0 ? 'firstChild' : 'lastChild'];
						}

						if (_this._selection) {
							L.DomUtil.addClass(_this._selection.firstChild, 'leaflet-routing-geocoder-selected');
						}
					},
					index;

				switch (e.keyCode) {
				// Up
				case 38:
					select(-1);
					L.DomEvent.preventDefault(e);
					break;
				// Up
				case 40:
					select(1);
					L.DomEvent.preventDefault(e);
					break;
				// Enter
				case 13:
					if (this._selection) {
						index = parseInt(this._selection.getAttribute('data-result-index'), 10);
						this.onResultSelected(this._results[index]);
						L.DomEvent.preventDefault(e);
					}
				}
				return true;
			},

			remove: function() {
				if (this._container) {
					L.DomEvent.removeListener(this._elem, 'keydown', this._keyPressed);
					this._container.parentElement.removeChild(this._container);
					delete this._container;
					delete this._elem;
				}
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
				wps.push(this._waypoints[i].latLng);
			}

			return wps;
		},

		setWaypoints: function(waypoints) {
			var args = [0, this._waypoints.length].concat(waypoints);
			this.spliceWaypoints.apply(this, args);
		},

		spliceWaypoints: function() {
			var i,
				args = [arguments[0], arguments[1]];

			for (i = 2; i < arguments.length; i++) {
				args.push(new Waypoint(arguments[i]));
			}

			[].splice.apply(this._waypoints, args);

			while (this._waypoints.length < 2) {
				this._waypoints.push(new Waypoint());
			}

			this._updateMarkers();
			this._fireChanged.apply(this, arguments);
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

			this._updateWaypointName(i);

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
						var gr,
							_this = this;
						if (results.length === 1) {
							geocoderElem.value = results[0].name;
							this._waypoints[thisIndex].name = results[0].name;
							this._waypoints[thisIndex].latLng = results[0].center;
							this._updateMarkers();
							this._fireChanged();
						} else {
							gr = new GeocoderResults(results).addTo(geocoderElem);
							L.DomEvent.addListener(geocoderElem, 'blur', function() {
								// Don't remove before onResultSelected has got a chance to fire
								// TODO: this looks like a hack
								setTimeout(function() {gr.remove();}, 50);
							});
							gr.onResultSelected = function(r) {
								gr.remove();
								geocoderElem.value = r.name;
								_this._waypoints[thisIndex].name = r.name;
								_this._waypoints[thisIndex].latLng = r.center;
								_this._updateMarkers();
								_this._fireChanged();
							};
						}
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

		_updateWaypointName: function(i, force) {
			var wp = this._waypoints[i];
			if (this.options.geocoder && wp.latLng && (force || !wp.name)) {
				this.options.geocoder.reverse(wp.latLng, 67108864 /* zoom 18 */, function(rs) {
					if (rs.length > 0 && rs[0].center.distanceTo(wp.latLng) < 200) {
						wp.name = rs[0].name;
					} else {
						wp.name = '';
					}
					this._geocoderElems[i].value = wp.name;
				}, this);
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
			if (this.isReady()) {
				this.fire('waypointschanged', {waypoints: this.getWaypoints()});
			}

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
			this._updateGeocoders(this._newWp.afterIndex + 1);
			delete this._newWp;
		}
	});

	L.Routing.plan = function(waypoints, options) {
		return new L.Routing.Plan(waypoints, options);
	};
})();
