(function() {
	'use strict';

	L.Routing.Control = L.Routing.Itinerary.extend({
		options: {
		},

		initialize: function(options) {
			L.Util.setOptions(this, options);

			this._router = this.options.router || new L.Routing.OSRM();
			this._waypoints = this.options.waypoints || [];

			L.Routing.Itinerary.prototype.initialize.call(this, this._router);

			this.on('routeselected', this._routeSelected, this);

			this._route();
		},

		onAdd: function(map) {
			var container = L.Routing.Itinerary.prototype.onAdd.call(this, map);

			this._map = map;
			if (this.options.geocoder) {
				container.insertBefore(this._createGeocoders(), container.firstChild);
			}

			return container;
		},

		onRemove: function(map) {
			if (this._line) {
				map.removeLayer(this._line);
			}
			return L.Routing.Itinerary.prototype.onRemove.call(this, map);
		},

		setWaypoints: function(waypoints) {
			this._waypoints = waypoints;
			this._route();
		},

		spliceWaypoints: function() {
			var removed = [].splice.apply(this._waypoints, arguments);
			this._route();
			return removed;
		},

		_routeSelected: function(e) {
			var route = e.route;

			if (this._line) {
				this._map.removeLayer(this._line);
			}

			this._line = L.Routing.line(route);
			this._line.addTo(this._map);
			this._hookEvents(this._line);
			this._map.fitBounds(this._line.getBounds());

			if (this.options.geocoder) {
				this._setGeocoderValue(0, route.summary.start_point);
				this._setGeocoderValue(this._geocoderElems.length - 1, route.summary.end_point);
			}
		},

		_hookEvents: function(l) {
			var wps = this._waypoints,
			    _this = this,
				t;

			l.on('waypointdrag', function(e) {
				wps[e.index] = e.latlng;
				if (t) {
					clearTimeout(t);
				}
				t = setTimeout(function() {
					_this._route();
				}, 1000);
			});

			l.on('waypointadded', function(e) {
				this.spliceWaypoints(e.afterIndex + 1, 0, e.latlng);
			}, this);
		},

		_createGeocoders: function() {
			var container = L.DomUtil.create('div', 'leaflet-routing-geocoders'),
			    i,
			    geocoder,
			    addWpBtn;

			while (this._waypoints.length < 2) {
				this._waypoints.push(null);
			}

			this._geocoderElems = [];

			for (i = 0; i < this._waypoints.length; i++) {
				geocoder = this._createGeocoder(i);
				container.appendChild(geocoder);
				this._geocoderElems.push(geocoder);
			}

			addWpBtn = L.DomUtil.create('button', '', container);
			addWpBtn.type = 'button';
			addWpBtn.innerHTML = '+';
			L.DomEvent.addListener(addWpBtn, 'click', function() {
				this.spliceWaypoints(this._waypoints.length + 1, 0, null);
				this._container.removeChild(container);
				this._container.insertBefore(this._createGeocoders(), this._container.firstChild);
			}, this);

			return container;
		},

		_createGeocoder: function(i) {
			var geocoder,
			    listener;

			geocoder = L.DomUtil.create('input', '');
			if (i === 0) {
				geocoder.placeholder = 'Start';
			} else if (i >= this._waypoints.length - 1) {
				geocoder.placeholder = 'End';
			} else {
				geocoder.placeholder = 'Via';
			}

			listener = this._createGeocodeListener(i);
			L.DomEvent.addListener(geocoder, 'keydown', listener, this);

			return geocoder;
		},

		_createGeocodeListener: function(i) {
			return function(e) {
				if (e.keyCode === 13) {
					this.options.geocoder.geocode(e.target.value, function(results) {
						this.spliceWaypoints(i, 1, results[0].center);
					}, this);
				}
			};
		},

		_setGeocoderValue: function(i, v) {
			this._geocoderElems[i].value = this._geocoderElems[i].value || v;
		},

		_route: function() {
			var i;
			if (!this._waypoints || this._waypoints.length < 2) {
				return;
			}

			for (i = 0; i < this._waypoints.length; i++) {
				if (!this._waypoints[i]) {
					return;
				}
			}

			this._router.route(this._waypoints);
		}
	});

	L.Routing.control = function(options) {
		return new L.Routing.Control(options);
	};
})();
