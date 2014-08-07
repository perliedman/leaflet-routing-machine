(function() {
	'use strict';

	L.Routing = L.Routing || {};

	L.Routing.Itinerary = L.Control.extend({
		includes: L.Mixin.Events,

		options: {
			units: 'metric',
			pointMarkerStyle: {
				radius: 5,
				color: '#03f',
				fillColor: 'white',
				opacity: 1,
				fillOpacity: 0.7
			},
			summaryTemplate: '<h2>{name}</h2><h3>{distance}, {time}</h3>',
			distanceTemplate: '{value} {unit}',
			timeTemplate: '{time}',
			unitNames: {
				meters: 'm',
				kilometers: 'km',
				yards: 'yd',
				miles: 'mi',
				hours: 'h',
				minutes: 'mín',
				seconds: 's'
			},
			containerClassName: '',
			alternativeClassName: '',
			minimizedClassName: '',
			itineraryClassName: '',
			roundingSensitivity: 1,
			show: true
		},

		initialize: function(options) {
			L.setOptions(this, options);
		},

		onAdd: function() {
			this._container = L.DomUtil.create('div', 'leaflet-routing-container leaflet-bar ' +
				(!this.options.show ? 'leaflet-routing-container-hide' : '') +
				this.options.containerClassName);
			L.DomEvent.disableClickPropagation(this._container);
			L.DomEvent.addListener(this._container, 'mousewheel', function(e) {
				L.DomEvent.stopPropagation(e);
			});
			return this._container;
		},

		onRemove: function() {
		},

		setAlternatives: function(routes) {
			var i,
			    alt,
			    altDiv;

			this._clearAlts();

			this._routes = routes;

			for (i = 0; i < this._routes.length; i++) {
				alt = this._routes[i];
				altDiv = this._createAlternative(alt, i);
				this._container.appendChild(altDiv);
				this._altElements.push(altDiv);
			}

			this.fire('routeselected', {route: this._routes[0]});

			return this;
		},

		show: function() {
			L.DomUtil.removeClass(this._container, 'leaflet-routing-container-hide');
		},

		hide: function() {
			L.DomUtil.addClass(this._container, 'leaflet-routing-container-hide');
		},

		_createAlternative: function(alt, i) {
			var altDiv = L.DomUtil.create('div', 'leaflet-routing-alt ' +
				this.options.alternativeClassName +
				(i > 0 ? ' leaflet-routing-alt-minimized ' + this.options.minimizedClassName : ''));
			altDiv.innerHTML = L.Util.template(this.options.summaryTemplate, {
				name: alt.name,
				distance: this._formatDistance(alt.summary.totalDistance),
				time: this._formatTime(alt.summary.totalTime)
			});
			L.DomEvent.addListener(altDiv, 'click', this._onAltClicked, this);

			altDiv.appendChild(this._createItineraryTable(alt));
			return altDiv;
		},

		_clearAlts: function() {
			var i,
				alt;
			// TODO: this is really inelegant
			for (i = 0; this._container && i < this._container.children.length; i++) {
				alt = this._container.children[i];
				if (L.DomUtil.hasClass(alt, 'leaflet-routing-alt')) {
					this._container.removeChild(alt);
					i--;
				}
			}

			this._altElements = [];
		},

		_createItineraryTable: function(r) {
			var table = L.DomUtil.create('table', this.options.itineraryClassName),
			    body = L.DomUtil.create('tbody', '', table),
			    i,
			    instr,
			    row,
			    td;

			for (i = 0; i < r.instructions.length; i++) {
				instr = r.instructions[i];
				row = L.DomUtil.create('tr', '', body);
				td = L.DomUtil.create('td', '', row);
				td.appendChild(document.createTextNode(this._instruction(instr, i)));
				td = L.DomUtil.create('td', '', row);
				td.appendChild(document.createTextNode(this._formatDistance(instr.distance)));
				this._addRowListeners(row, r.coordinates[instr.index]);
			}

			return table;
		},

		_addRowListeners: function(row, coordinate) {
			var _this = this,
			    marker;
			L.DomEvent.addListener(row, 'mouseover', function() {
				marker = L.circleMarker(coordinate,
					_this.options.pointMarkerStyle).addTo(_this._map);
			});
			L.DomEvent.addListener(row, 'mouseout', function() {
				if (marker) {
					_this._map.removeLayer(marker);
					marker = null;
				}
			});
			L.DomEvent.addListener(row, 'click', function(e) {
				_this._map.panTo(coordinate);
				L.DomEvent.stopPropagation(e);
			});
		},

		_onAltClicked: function(e) {
			var altElem,
			    j,
			    n,
			    isCurrentSelection,
			    classFn;

			altElem = e.target || window.event.srcElement;
			while (!L.DomUtil.hasClass(altElem, 'leaflet-routing-alt')) {
				altElem = altElem.parentElement;
			}

			if (L.DomUtil.hasClass(altElem, 'leaflet-routing-alt-minimized')) {
				for (j = 0; j < this._altElements.length; j++) {
					n = this._altElements[j];
					isCurrentSelection = altElem === n;
					classFn = isCurrentSelection ? 'removeClass' : 'addClass';
					L.DomUtil[classFn](n, 'leaflet-routing-alt-minimized');
					if (this.options.minimizedClassName) {
						L.DomUtil[classFn](n, this.options.minimizedClassName);
					}

					if (isCurrentSelection) {
						// TODO: don't fire if the currently active is clicked
						this.fire('routeselected', {route: this._routes[j]});
					}
				}
			}

			L.DomEvent.stop(e);
		},

		_formatDistance: function(d /* Number (meters) */) {
			var un = this.options.unitNames,
			    v,
				data;

			if (this.options.units === 'imperial') {
				d = d / 1.609344;
				if (d >= 1000) {
					data = {
						value: (this._round(d) / 1000),
						unit: un.miles
					};
				} else {
					data = {
						value: this._round(d / 1.760),
						unit: un.yards
					};
				}
			} else {
				v = this._round(d);
				data = {
					value: v >= 1000 ? (v / 1000) : v,
					unit: v >= 1000 ? un.kilometers : un.meters
				};
			}

			return L.Util.template(this.options.distanceTemplate, data);
		},

		_round: function(d) {
			var pow10 = Math.pow(10, (Math.floor(d / this.options.roundingSensitivity) + '').length - 1),
				r = Math.floor(d / pow10),
				p = (r > 5) ? pow10 : pow10 / 2;

			return Math.round(d / p) * p;
		},

		_formatTime: function(t /* Number (seconds) */) {
			if (t > 86400) {
				return Math.round(t / 3600) + ' h';
			} else if (t > 3600) {
				return Math.floor(t / 3600) + ' h ' +
					Math.round((t % 3600) / 60) + ' min';
			} else if (t > 300) {
				return Math.round(t / 60) + ' min';
			} else if (t > 60) {
				return Math.floor(t / 60) + ' min ' +
					(t % 60) + ' s';
			} else {
				return t + ' s';
			}
		},

		_instruction: function(instr, i) {
			if (instr.type !== undefined) {
				return L.Util.template(this._getInstructionTemplate(instr, i),
					L.extend({exit: this._formatOrder(instr.exit), dir: this._dir[instr.direction]},
						instr));
			} else {
				return instr.text;
			}
		},

		_getInstructionTemplate: function(instr, i) {
			switch (instr.type) {
			case 'Straight':
				return (i === 0 ? 'Head' : 'Continue') + ' {dir}' + (instr.road ? ' on {road}' : '');
			case 'SlightRight':
				return 'Slight right' + (instr.road ? ' onto {road}' : '');
			case 'Right':
				return 'Right' + (instr.road ? ' onto {road}' : '');
			case 'SharpRight':
				return 'Sharp right' + (instr.road ? ' onto {road}' : '');
			case 'TurnAround':
				return 'Turn around';
			case 'SharpLeft':
				return 'Sharp left' + (instr.road ? ' onto {road}' : '');
			case 'Left':
				return 'Left' + (instr.road ? ' onto {road}' : '');
			case 'SlightLeft':
				return 'Slight left' + (instr.road ? ' onto {road}' : '');
			case 'WaypointReached':
				return 'Waypoint reached';
			case 'Roundabout':
				return  'Take the {exit} exit in the roundabout';
			case 'DestinationReached':
				return  'Destination reached';
			}
		},

		_formatOrder: function(n) {
			var i = n % 10 - 1,
				suffix = ['st', 'nd', 'rd'];

			return suffix[i] ? n + suffix[i] : n + 'th';
		},

		_dir: {
			N: 'north',
			NE: 'northeast',
			E: 'east',
			SE: 'southeast',
			S: 'south',
			SW: 'southwest',
			W: 'west',
			NW: 'northwest'
		}
	});

	L.Routing.Itinerary._instructions = {
	};

	L.Routing.itinerary = function(router) {
		return new L.Routing.Itinerary(router);
	};
})();
