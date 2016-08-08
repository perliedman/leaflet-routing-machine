(function() {
	'use strict';

	var L = require('leaflet');

	L.Routing = L.Routing || {};
	L.extend(L.Routing, require('./L.Routing.OSRMv1'));

	/**
	 * Works against OSRM's new API in version 5.0; this has
	 * the API version v1.
	 */
	L.Routing.Mapbox = L.Routing.OSRMv1.extend({
		options: {
			serviceUrl: 'https://api.mapbox.com/directions/v5',
			profile: 'mapbox/driving',
			useHints: false
		},

		initialize: function(accessToken, options) {
			L.Routing.OSRMv1.prototype.initialize.call(this, options);
			this.options.requestParameters = this.options.requestParameters || {};
			/* jshint camelcase: false */
			this.options.requestParameters.access_token = accessToken;
			/* jshint camelcase: true */
		}
	});

	L.Routing.mapbox = function(accessToken, options) {
		return new L.Routing.Mapbox(accessToken, options);
	};

	module.exports = L.Routing;
})();
