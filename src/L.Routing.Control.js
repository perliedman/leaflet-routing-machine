(function() {
	'use strict';

	L.Routing.Control = L.Routing.Itinerary.extend({
		options: {
		},

		initialize: function(options) {
			L.Util.setOptions(this, options);

			this._router = this.options.router || new L.Routing.OSRM();
			this._plan = this.options.plan || L.Routing.plan();
			if (this.options.waypoints) {
				this._plan.setWaypoints(this.options.waypoints);
			}

			L.Routing.Itinerary.prototype.initialize.call(this, this._router);

			this.on('routeselected', this._routeSelected, this);
			this._plan.on('waypointschanged', this._route, this);

			this._route();
		},

		onAdd: function(map) {
			var container = L.Routing.Itinerary.prototype.onAdd.call(this, map);

			this._map = map;
			if (this.options.geocoder) {
				container.insertBefore(this._createGeocoders(), container.firstChild);
			}
			this._map.addLayer(this._plan);

			return container;
		},

		onRemove: function(map) {
			if (this._line) {
				map.removeLayer(this._line);
			}
			map.removeLayer(this._plan);
			return L.Routing.Itinerary.prototype.onRemove.call(this, map);
		},

		setWaypoints: function(waypoints) {
			this._plan.setWaypoints(waypoints);
		},

		spliceWaypoints: function() {
			var removed = this._plan.spliceWaypoints.apply(this._plan, arguments);
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
			l.on('linetouched', function(e) {
				this._plan.dragNewWaypoint(e);
			}, this);
		},

		_createGeocoders: function() {
			var container = L.DomUtil.create('div', 'leaflet-routing-geocoders'),
				waypoints = this._plan.getWaypoints(),
			    i,
			    geocoder,
			    addWpBtn;

			this._geocoderElems = [];

			for (i = 0; i < waypoints.length; i++) {
				geocoder = this._createGeocoder(i);
				container.appendChild(geocoder);
				this._geocoderElems.push(geocoder);
			}

			addWpBtn = L.DomUtil.create('button', '', container);
			addWpBtn.type = 'button';
			addWpBtn.innerHTML = '+';
			L.DomEvent.addListener(addWpBtn, 'click', function() {
				this.spliceWaypoints(waypoints.length + 1, 0, null);
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
			} else if (i >= this._plan.getWaypoints().length - 1) {
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
			if (this._plan.isReady()) {
				this._router.route(this._plan.getWaypoints());
			}
		}
	});

	L.Routing.control = function(options) {
		return new L.Routing.Control(options);
	};
})();
