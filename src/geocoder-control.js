var L = require('leaflet'),
	GeocoderElement = require('./geocoder-element'),
	Waypoint = require('./waypoint');

module.exports = L.Class.extend({
	includes: L.Mixin.Events,

	options: {
		addWaypoints: true,
		reverseWaypoints: true,
		addButtonClassName: '',
		language: 'en',
		createGeocoderElement: function(wp, i, nWps, options) { return new GeocoderElement(wp, i, nWps, options); }
	},

	initialize: function(plan, options) {
		L.Util.setOptions(this, options);
		this._plan = plan;
	},

	onAdd: function() {
		var container = L.DomUtil.create('div', 'leaflet-routing-geocoders ' + this.options.geocodersClassName),
			addWpBtn,
			reverseBtn;

		this._geocoderContainer = container;
		this._geocoderElems = [];


		if (this.options.addWaypoints) {
			addWpBtn = L.DomUtil.create('button', 'leaflet-routing-add-waypoint ' + this.options.addButtonClassName, container);
			addWpBtn.setAttribute('type', 'button');
			L.DomEvent.addListener(addWpBtn, 'click', function() {
				var waypoints = this._plan.getWaypoints();
				this._plan.spliceWaypoints(waypoints.length, 0, new Waypoint());
			}, this);
		}

		if (this.options.reverseWaypoints) {
			reverseBtn = L.DomUtil.create('button', 'leaflet-routing-reverse-waypoints', container);
			reverseBtn.setAttribute('type', 'button');
			L.DomEvent.addListener(reverseBtn, 'click', function() {
				var waypoints = this._plan.getWaypoints();
				waypoints.reverse();
				this._plan.setWaypoints(waypoints);
			}, this);
		}

		this._updateGeocoders();
		this._plan.on('waypointschanged', this._updateGeocoders, this);

		return container;
	},

	_createGeocoder: function(wp, i, nWps) {
		var geocoder = this.options.createGeocoderElement(wp, i, nWps, this.options);
		geocoder
		.on('delete', function() {
			if (i > 0 || this._plan.getWaypoints().length > 2) {
				this._plan.spliceWaypoints(i, 1);
			} else {
				this._plan.spliceWaypoints(i, 1, new Waypoint());
			}
			this.fire('delete', {waypointIndex: i});
		}, this)
		.on('geocoded', function(e) {
			this._focusGeocoder(i + 1);
			this._plan.spliceWaypoints(i, 1, e.waypoint);
			this.fire('waypointgeocoded', {
				waypointIndex: i,
				waypoint: e.waypoint
			});
		}, this)
		.on('reversegeocoded', function(e) {
			this.fire('waypointgeocoded', {
				waypointIndex: i,
				waypoint: e.waypoint
			});
		}, this);

		return geocoder;
	},

	_updateGeocoders: function() {
		var elems = [],
			waypoints = this._plan.getWaypoints(),
			i,
		    geocoderElem;

		for (i = 0; i < this._geocoderElems.length; i++) {
			this._geocoderContainer.removeChild(this._geocoderElems[i].getContainer());
		}

		for (i = waypoints.length - 1; i >= 0; i--) {
			geocoderElem = this._createGeocoder(waypoints[i], i, waypoints.length);
			this._geocoderContainer.insertBefore(geocoderElem.getContainer(), this._geocoderContainer.firstChild);
			elems.push(geocoderElem);
		}

		this._geocoderElems = elems.reverse();
	},

	_focusGeocoder: function(i) {
		if (this._geocoderElems[i]) {
			this._geocoderElems[i].focus();
		} else {
			document.activeElement.blur();
		}
	}
});
