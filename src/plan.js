'use strict';

var L = require('leaflet'),
	GeocoderElement = require('./geocoder-element'),
	Waypoint = require('./waypoint');

module.exports = L.Class.extend({
	includes: L.Mixin.Events,

	options: {
		dragStyles: [
			{color: 'black', opacity: 0.15, weight: 9},
			{color: 'white', opacity: 0.8, weight: 6},
			{color: 'red', opacity: 1, weight: 2, dashArray: '7,12'}
		]
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

		this._fireChanged.apply(this, args);
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
	}
});
