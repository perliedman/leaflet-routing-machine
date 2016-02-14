'use strict';

var L = require('leaflet'),
	Formatter = require('./formatter'),
	InstructionElement = require('./instruction-element');

module.exports = L.Class.extend({
	includes: L.Mixin.Events,

	options: {
		pointMarkerStyle: {
			radius: 5,
			color: '#03f',
			fillColor: 'white',
			opacity: 1,
			fillOpacity: 0.7
		},
		summaryTemplate: '<h2>{name}</h2><h3>{distance}, {time}</h3>',
		timeTemplate: '{time}',
		alternativeClassName: '',
		itineraryClassName: '',
		totalDistanceRoundingSensitivity: -1
	},

	initialize: function(options) {
		L.setOptions(this, options);
		this._formatter = this.options.formatter || new Formatter(this.options);
		this._instructionElement = this.options.instructionElement || new InstructionElement({
			containerClassName: this.options.itineraryClassName
		});
	},

	onAdd: function(map) {
		this._altContainer = this.createAlternativesContainer();
		this._map = map;
		return this._altContainer;
	},

	createAlternativesContainer: function() {
		return L.DomUtil.create('div', 'leaflet-routing-alternatives-container');
	},

	setAlternatives: function(routes) {
		var i,
		    alt,
		    altDiv;

		this.clearAlternatives();

		this._routes = routes;

		for (i = 0; i < this._routes.length; i++) {
			alt = this._routes[i];
			altDiv = this._createAlternative(alt, i);
			this._altContainer.appendChild(altDiv);
			this._altElements[L.stamp(alt)] = altDiv;
			this._elementRoutes[L.stamp(altDiv)] = alt;
		}

		this._selectRoute({route: this._routes[0], alternatives: this._routes.slice(1)});

		return this;
	},

	clearAlternatives: function() {
		var el = this._altContainer;
		while (el && el.firstChild) {
			el.removeChild(el.firstChild);
		}

		this._altElements = {};
		this._elementRoutes = {};
	},

	selectAlternative: function(route) {
		var selectedElement,
			selectedKey = L.stamp(route).toString(),
			keys,
			key,
		    j,
		    n,
		    classFn;

		selectedElement = this._altElements[selectedKey];

		if (L.DomUtil.hasClass(selectedElement, 'leaflet-routing-alt-minimized')) {
			keys = Object.keys(this._altElements);
			for (j = 0; j < keys.length; j++) {
				key = keys[j];
				n = this._altElements[key];
				classFn = key === selectedKey ? 'removeClass' : 'addClass';
				L.DomUtil[classFn](n, 'leaflet-routing-alt-minimized');
				if (this.options.minimizedClassName) {
					L.DomUtil[classFn](n, this.options.minimizedClassName);
				}

				if (key !== selectedKey) {
					n.scrollTop = 0;
				}
			}
		}
	},

	_createAlternative: function(alt, i) {
		var altDiv = L.DomUtil.create('div', 'leaflet-routing-alt ' +
			this.options.alternativeClassName +
			(i > 0 ? ' leaflet-routing-alt-minimized ' + this.options.minimizedClassName : '')),
			template = this.options.summaryTemplate,
			data = L.extend({
				name: alt.name,
				distance: this._formatter.formatDistance(alt.summary.totalDistance, this.options.totalDistanceRoundingSensitivity),
				time: this._formatter.formatTime(alt.summary.totalTime)
			}, alt);
		altDiv.innerHTML = typeof(template) === 'function' ? template(data) : L.Util.template(template, data);
		L.DomEvent.addListener(altDiv, 'click', this._onAltClicked, this);
		this.on('routeselected', this._selectAlt, this);

		altDiv.appendChild(this._createItineraryContainer(alt));
		return altDiv;
	},

	_createItineraryContainer: function(r) {
		var findInstruction = function(el) {
				while (el != null && el.getAttribute('data-coord-index') == null) {
					el = el.parentElement;
				}

				return el;
			},
			removeMarker = L.bind(function() {
				if (this._marker) {
					this._map.removeLayer(this._marker);
					delete this._marker;
				}
			}, this),
			container = this._instructionElement.createContainer(),
		    steps = this._instructionElement.createStepsContainer(),
		    i,
		    instr,
		    step,
		    distance,
		    text,
		    icon;

		container.appendChild(steps);

		for (i = 0; i < r.instructions.length; i++) {
			instr = r.instructions[i];
			text = this._formatter.formatInstruction(instr, i);
			distance = this._formatter.formatDistance(instr.distance);
			icon = this._formatter.getIconName(instr, i);
			step = this._instructionElement.createStep(text, distance, icon, steps);
			step.setAttribute('data-coord-index', instr.index);
		}

		L.DomEvent.addListener(steps, 'mousemove', function(e) {
			var el = findInstruction(e.target),
				index;
			if (el) {
				index = parseInt(el.getAttribute('data-coord-index'));
				if (!this._marker || this._marker.index !== index) {
					removeMarker();
					this._marker = L.circleMarker(r.coordinates[index],
						this.options.pointMarkerStyle).addTo(this._map);
					this._marker.index = index;
				}
			}
		}, this);
		L.DomEvent.addListener(steps, 'mouseout', function() {
			removeMarker();
		}, this);
		L.DomEvent.addListener(steps, 'click', function(e) {
			var el = findInstruction(e.target),
				index;
			if (el) {
				index = parseInt(el.getAttribute('data-coord-index'));
				this._map.panTo(r.coordinates[index]);
				L.DomEvent.stopPropagation(e);
			}
			console.log(e);
		}, this);

		return container;
	},

	_onAltClicked: function(e) {
		var altElem = e.target || window.event.srcElement;
		while (!L.DomUtil.hasClass(altElem, 'leaflet-routing-alt')) {
			altElem = altElem.parentElement;
		}

		var j = this._routes.indexOf(this._elementRoutes[L.stamp(altElem)]);
		var alts = this._routes.slice();
		var route = alts.splice(j, 1)[0];

		this.fire('routeselected', {
			route: route,
			alternatives: alts
		});
	},

	_selectAlt: function(e) {
		this.selectAlternative(e.route);
		L.DomEvent.stop(e);
	},

	_selectRoute: function(routes) {
		if (this._marker) {
			this._map.removeLayer(this._marker);
			delete this._marker;
		}
		this.fire('routeselected', routes);
	}
});
