'use strict';

var L = require('leaflet'),
	Itinerary = require('./itinerary'),
	GeocoderControl = require('./geocoder-control'),
	Line = require('./line'),
	Plan = require('./plan'),
	OSRM = require('./osrm'),
	Waypoint = require('./waypoint'),
	WaypointsLayer = require('./waypoints-layer');

/**
 * Main control
 * @class L.Routing.Control
 * @inherits L.Control
 *
 * @param {Object} options The control's options; note that these options are also passed
 * on to any other classes implicitly created by the control, like the control's plan, 
 * geocoder control, etc.
 * @param {Object} [options.fitSelectedRoutes="smart"] Mode for fitting the route into the map:
 * if <code>false</code>, route will not be fitted. If <code>true</code>, route will
 * always be fitted when changed. If set to the string <code>"smart"</code>, the route
 * will be fitted when no waypoint is visible, or if the route covers a very small part
 * of the viewport.
 * @param {Function} options.routeLine Factory function to create the map layer used for
 * reperesenting a route on the map; default is a factory that creates a {@link L.Routing.Line}.
 * The function should accept an {@link L.Routing.IRoute} and options as arguments.
 */
module.exports = L.Control.extend({
	includes: L.Mixin.Events,

	options: {
		fitSelectedRoutes: 'smart',
		routeLine: function(route, options) { return new Line(route, options); },
		autoRoute: true,
		routeWhileDragging: true,
		routeDragInterval: 500,
		waypointMode: 'connect',
		useZoomParameter: true,
		showAlternatives: true,
		containerClassName: '',
		minimizedClassName: '',
		show: true,
		collapsible: undefined,
		collapseBtn: function(itinerary) {
			var collapseBtn = L.DomUtil.create('span', itinerary.options.collapseBtnClass);
			L.DomEvent.on(collapseBtn, 'click', itinerary._toggle, itinerary);
			itinerary._container.insertBefore(collapseBtn, itinerary._container.firstChild);
		},
			collapseBtnClass: 'leaflet-routing-collapse-btn',
	},

	initialize: function(options) {
		L.Util.setOptions(this, options);

		this._router = this.options.router || new OSRM(options);
		this._itinerary = this.options.itinerary || new Itinerary(options);
		this._plan = this.options.plan || new Plan(this.options.waypoints, options);
		this._geocoderControl = this.options.geocoderControl || new GeocoderControl(this._plan, options);
		this._waypointsLayer = this.options.waypointsLayer || new WaypointsLayer(this._plan);
		this._requestCount = 0;

		L.Control.prototype.initialize.call(this, options);

		this.on('routeselected', this._routeSelected, this);
		if (this._itinerary) {
			this._itinerary.on('routeselected', this._routeSelected, this);
		}
		this._plan.on('waypointschanged', this._onWaypointsChanged, this);
		if (options.routeWhileDragging) {
			this._setupRouteDragging();
		}

		if (this.options.autoRoute) {
			this.route();
		}
	},

	onAdd: function(map) {
		var collapsible = this.options.collapsible;
		collapsible = collapsible || (collapsible === undefined && map.getSize().x <= 640);

		var container = L.DomUtil.create('div', 'leaflet-routing-container leaflet-bar ' +
			(!this.options.show ? 'leaflet-routing-container-hide ' : '') +
			(collapsible ? 'leaflet-routing-collapsible ' : '') +
			this.options.containerClassName);
		L.DomEvent.addListener(container, 'mousewheel', function(e) {
			L.DomEvent.stopPropagation(e);
		});

		L.DomEvent.disableClickPropagation(container);
		if (collapsible) {
			this.options.collapseBtn(this);
		}

		this._map = map;

		if (this.options.useZoomParameter) {
			this._map.on('zoomend', function() {
				this.route({
					callback: L.bind(this._updateLineCallback, this)
				});
			}, this);
		}

		if (this._geocoderControl) {
			container.appendChild(this._geocoderControl.onAdd());
		}

		if (this._itinerary) {
			container.appendChild(this._itinerary.onAdd(map));
		}

		if (this._waypointsLayer) {
			this._map.addLayer(this._waypointsLayer);
		}

		this._container = container;

		return container;
	},

	onRemove: function(map) {
		if (this._line) {
			map.removeLayer(this._line);
		}

		if (this._waypointsLayer) {
			map.removeLayer(this._waypointsLayer);
		}

		return Itinerary.prototype.onRemove.call(this, map);
	},

	show: function() {
		L.DomUtil.removeClass(this._container, 'leaflet-routing-container-hide');
	},

	hide: function() {
		L.DomUtil.addClass(this._container, 'leaflet-routing-container-hide');
	},

	_toggle: function() {
		var collapsed = L.DomUtil.hasClass(this._container, 'leaflet-routing-container-hide');
		this[collapsed ? 'show' : 'hide']();
	},

	getWaypoints: function() {
		return this._plan.getWaypoints();
	},

	setWaypoints: function(waypoints) {
		this._plan.setWaypoints(waypoints);
		return this;
	},

	spliceWaypoints: function() {
		var removed = this._plan.spliceWaypoints.apply(this._plan, arguments);
		return removed;
	},

	getPlan: function() {
		return this._plan;
	},

	getRouter: function() {
		return this._router;
	},

	_routeSelected: function(e) {
		var route = e.route,
			alternatives = this.options.showAlternatives && e.alternatives,
			fitMode = this.options.fitSelectedRoutes,
			fitBounds =
				(fitMode === 'smart' && !this._waypointsVisible()) ||
				(fitMode !== 'smart' && fitMode);

		this._updateLines({route: route, alternatives: alternatives});

		if (fitBounds) {
			this._map.fitBounds(this._line.getBounds());
		}

		if (this.options.waypointMode === 'snap') {
			this._plan.off('waypointschanged', this._onWaypointsChanged, this);
			this.setWaypoints(route.waypoints);
			this._plan.on('waypointschanged', this._onWaypointsChanged, this);
		}
	},

	_waypointsVisible: function() {
		var wps = this.getWaypoints(),
			mapSize,
			bounds,
			boundsSize,
			i,
			p;

		try {
			mapSize = this._map.getSize();

			for (i = 0; i < wps.length; i++) {
				p = this._map.latLngToLayerPoint(wps[i].latLng);

				if (bounds) {
					bounds.extend(p);
				} else {
					bounds = L.bounds([p]);
				}
			}

			boundsSize = bounds.getSize();
			return (boundsSize.x > mapSize.x / 5 ||
				boundsSize.y > mapSize.y / 5) && this._waypointsInViewport();

		} catch (e) {
			return false;
		}
	},

	_waypointsInViewport: function() {
		var wps = this.getWaypoints(),
			mapBounds,
			i;

		try {
			mapBounds = this._map.getBounds();
		} catch (e) {
			return false;
		}

		for (i = 0; i < wps.length; i++) {
			if (mapBounds.contains(wps[i].latLng)) {
				return true;
			}
		}

		return false;
	},

	_updateLines: function(routes) {
		var addWaypoints = this.options.addWaypoints !== undefined ?
			this.options.addWaypoints : true;
		this._clearLines();

		// add alternatives first so they lie below the main route
		this._alternatives = [];
		if (routes.alternatives) routes.alternatives.forEach(function(alt, i) {
			this._alternatives[i] = this.options.routeLine(alt,
				L.extend({
					isAlternative: true
				}, this.options.altLineOptions || this.options.lineOptions));
			this._alternatives[i].addTo(this._map);
			this._hookAltEvents(this._alternatives[i]);
		}, this);

		this._line = this.options.routeLine(routes.route,
			L.extend({
				addWaypoints: addWaypoints,
				extendToWaypoints: this.options.waypointMode === 'connect'
			}, this.options.lineOptions));
		this._line.addTo(this._map);
		this._hookEvents(this._line);
	},

	_hookEvents: function(l) {
		l.on('linetouched', function(e) {
			this._plan.dragNewWaypoint(e);
		}, this);
	},

	_hookAltEvents: function(l) {
		l.on('linetouched', function(e) {
			var alts = this._routes.slice();
			var selected = alts.splice(e.target._route.routesIndex, 1)[0];
			this.fire('routeselected', {route: selected, alternatives: alts});
		}, this);
	},

	_onWaypointsChanged: function(e) {
		if (this.options.autoRoute) {
			this.route({});
		}
		if (!this._plan.isReady()) {
			this._clearLines();
			this._itinerary.clearAlternatives();
		}
		this.fire('waypointschanged', {waypoints: e.waypoints});
	},

	_setupRouteDragging: function() {
		var timer = 0,
			waypoints;

		if (this._waypointsLayer) {
			this._waypointsLayer.on('waypointdrag', L.bind(function(e) {
				waypoints = e.waypoints;

				if (!timer) {
					timer = setTimeout(L.bind(function() {
						this.route({
							waypoints: waypoints,
							geometryOnly: true,
							callback: L.bind(this._updateLineCallback, this)
						});
						timer = undefined;
					}, this), this.options.routeDragInterval);
				}
			}, this));
			this._waypointsLayer.on('waypointdragend', function() {
				if (timer) {
					clearTimeout(timer);
					timer = undefined;
				}
				this.route();
			}, this);
		}
	},

	_updateLineCallback: function(err, routes) {
		if (!err) {
			this._updateLines({route: routes[0], alternatives: routes.slice(1) });
		} else {
			this._clearLines();
		}
	},

	route: function(options) {
		var ts = ++this._requestCount,
			wps;

		options = options || {};

		if (this._plan.isReady()) {
			if (this.options.useZoomParameter) {
				options.z = this._map && this._map.getZoom();
			}

			wps = options && options.waypoints || this._plan.getWaypoints();
			this.fire('routingstart', {waypoints: wps});
			this._router.route(wps, options.callback || function(err, routes) {
				// Prevent race among multiple requests,
				// by checking the current request's timestamp
				// against the last request's; ignore result if
				// this isn't the latest request.
				if (ts === this._requestCount) {
					this._clearLines();
					if (this._itinerary) {
						this._itinerary.clearAlternatives();
						this._routes = [];
					}
					if (err) {
						this.fire('routingerror', {error: err});
						return;
					}

					routes.forEach(function(route, i) { route.routesIndex = i; });

					if (!options.geometryOnly) {
						this.fire('routesfound', {waypoints: wps, routes: routes});
						if (this._itinerary) {
							this._itinerary.setAlternatives(routes);
						}
						this._routes = routes;
					} else {
						var selectedRoute = routes.splice(0,1)[0];
						this._routeSelected({route: selectedRoute, alternatives: routes});
					}
				}
			}, this, options);
		}
	},

	_clearLines: function() {
		if (this._line) {
			this._map.removeLayer(this._line);
			delete this._line;
		}
		if (this._alternatives && this._alternatives.length) {
			for (var i in this._alternatives) {
				this._map.removeLayer(this._alternatives[i]);
			}
			this._alternatives = [];
		}
	}
});
