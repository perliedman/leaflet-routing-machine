(function() {
	'use strict';

	L.Routing = L.Routing || {};

	L.Routing.Itinerary = L.Control.extend({
		includes: L.Mixin.Events,
		initialize: function(router) {
			this._router = router;
		},

		onAdd: function() {
			this._container = L.DomUtil.create('div', 'leaflet-routing-container leaflet-bar');
			this._router.on('routefound', this._routeFound, this);

			return this._container;
		},

		onRemove: function() {
			this._router.off('routefound', this._routeFound, this);
		},

		_routeFound: function(e) {
			var i,
			    alt,
			    altDiv;

			this._routes = e.routes;

			this._container.innerHTML = '';
			for (i = 0; i < e.routes.length; i++) {
				alt = e.routes[i];
				altDiv = L.DomUtil.create('div', 'leaflet-routing-alt' +
					(i > 0 ? ' leaflet-routing-alt-minimized' : ''),
					this._container);
				altDiv.innerHTML = '<h2>' + alt.name.join(', ') + '</h2>' +
					'<h3>' + this._formatDistance(alt.summary.total_distance) +
					', ' + this._formatTime(alt.summary.total_time) + '</h3>';
				L.DomEvent.addListener(altDiv, 'click', this._onAltClicked, this);

				altDiv.appendChild(this._createItineraryTable(alt));
			}

			this.fire('routeselected', {route: this._routes[0]});
		},

		_createItineraryTable: function(r) {
			var table = L.DomUtil.create('table', ''),
			    body = L.DomUtil.create('tbody', '', table),
			    i,
			    instr,
			    driveDir,
			    row;

			for (i = 0; i < r.instructions.length; i++) {
				instr = r.instructions[i];
				driveDir = instr[0].split('-');
				row = L.DomUtil.create('tr', '', body);
				row.innerHTML = '<td>' + L.Routing.Itinerary._instructions[driveDir[0]] + '</td>' +
					'<td>' + instr[1] + '</td>' +
					'<td>' + this._formatDistance(instr[2]) + '</td>' +
					'<td>' + this._formatTime(instr[4]) + '</td>';
			}

			return table;
		},

		_onAltClicked: function(e) {
			var altElem,
			    j,
			    n,
			    isCurrentSelection;

			altElem = e.target;
			while (!L.DomUtil.hasClass(altElem, 'leaflet-routing-alt')) {
				altElem = altElem.parentElement;
			}

			for (j = 0; j < this._container.children.length; j++) {
				n = this._container.children[j];
				isCurrentSelection = altElem === n;
				L.DomUtil[isCurrentSelection ? 'removeClass' : 'addClass'](n, 'leaflet-routing-alt-minimized');

				if (isCurrentSelection) {
					this.fire('routeselected', {route: this._routes[j]});
				}
			}

			L.DomEvent.stop(e);
		},

		_formatDistance: function(d /* Number (meters) */) {
			var pow10 = Math.pow(10, (Math.floor(d) + '').length - 1),
				r = Math.floor(d / pow10 * 2),
				p = r % 2 ? pow10 / 2 : pow10,
				v = Math.round(d / p) * p;

			return v >= 1000 ? ((v / 1000) + ' km') : (v + ' m');
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
		}
	});

	L.Routing.Itinerary._instructions = {
		'0': '',
		'1': 'Straight',
		'2': 'Slight right',
		'3': 'Right',
		'4': 'Sharp right',
		'5': 'Turn around',
		'6': 'Sharp left',
		'7': 'Left',
		'8': 'Slight left',
		'9': '',
		'10': 'Continue',
		'11': 'Enter the roundabout',
		'12': 'Leave the roundabout',
		'13': 'Stay on roundabout',
		'14': 'Start at end of',
		'15': 'Destination reached',
		'16': 'Enter against allowed direction',
		'17': 'Leave against allowed direction'
	};

	L.Routing.itinerary = function(router) {
		return new L.Routing.Itinerary(router);
	}
})();
