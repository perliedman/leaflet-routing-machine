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
			L.DomEvent.disableClickPropagation(this._container);
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

			// TODO: this is really inelegant
			for (i = 0; i < this._container.children.length; i++) {
				alt = this._container.children[i];
				if (L.DomUtil.hasClass(alt, 'leaflet-routing-alt')) {
					this._container.removeChild(alt);
					i--;
				}
			}

			this._altElements = [];
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
				this._altElements.push(altDiv);
			}

			this.fire('routeselected', {route: this._routes[0]});
		},

		_createItineraryTable: function(r) {
			var table = L.DomUtil.create('table', ''),
			    body = L.DomUtil.create('tbody', '', table),
			    i,
			    instr,
			    row;

			for (i = 0; i < r.instructions.length; i++) {
				instr = r.instructions[i];
				row = L.DomUtil.create('tr', '', body);
				row.innerHTML =
					'<td>' + this._instruction(instr, i) + '</td>' +
					'<td>' + this._formatDistance(instr[2]) + '</td>';
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

			for (j = 0; j < this._altElements.length; j++) {
				n = this._altElements[j];
				isCurrentSelection = altElem === n;
				L.DomUtil[isCurrentSelection ? 'removeClass' : 'addClass'](n, 'leaflet-routing-alt-minimized');

				if (isCurrentSelection) {
					// TODO: don't fire if the currently active is clicked
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
		},

		_instruction: function(instr, i) {
			var template,
			    driveDir = instr[0].split('-');

			switch (parseInt(driveDir, 10)) {
			case 0:
				template = '';
				break;
			case 1:
				template = (i === 0 ? 'Head' : 'Continue') + ' {dir}' + (instr[1] ? ' on {1}' : '');
				break;
			case 2:
				template = 'Slight right' + (instr[1] ? ' onto {1}' : '');
				break;
			case 3:
				template = 'Right' + (instr[1] ? ' onto {1}' : '');
				break;
			case 4:
				template = 'Sharp right' + (instr[1] ? ' onto {1}' : '');
				break;
			case 5:
				template = 'Turn around';
				break;
			case 6:
				template = 'Sharp left' + (instr[1] ? ' onto {1}' : '');
				break;
			case 7:
				template = 'Left' + (instr[1] ? ' onto {1}' : '');
				break;
			case 8:
				template = 'Slight left' + (instr[1] ? ' onto {1}' : '');
				break;
			case 9:
				template = 'Waypoint reached';
				break;
			case 10:
				template =  'Head {dir}';
				break;
			case 11:
				template =  'Take the {exit} exit in the roundabout';
				break;
			case 12:
				template =  'Leave the roundabout by the {exit} exit';
				break;
			case 13:
				template =  'Stay on roundabout';
				break;
			case 14:
				template =  'Start at end of {1}';
				break;
			case 15:
				template =  'Destination reached';
				break;
			case 16:
				template =  'Enter against allowed direction';
				break;
			case 17:
				template =  'Leave against allowed direction';
				break;
			}

			return L.Util.template(template, L.extend({exit: this._formatOrder(driveDir[1]), dir: this._dir[instr[6]]}, instr));
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
