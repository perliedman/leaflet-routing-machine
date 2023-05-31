import * as L from 'leaflet';
import 'leaflet-control-geocoder';

import 'leaflet/../leaflet.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';

import { RoutingControl, ErrorControl } from '../../dist/esm/index';

import instructionStub from 'osrm-text-instructions';
const osrmTextInstructions = instructionStub('v5');

var map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var control = new RoutingControl({
	waypoints: [
		L.latLng(57.74, 11.94),
		L.latLng(57.6792, 11.949)
	],
	planOptions: {
		geocoder: L.Control.Geocoder.nominatim(),
	},
	routerOptions: {
		stepToText: (l, s, o) => osrmTextInstructions.compile(l, s, o),
	},
	routeWhileDragging: true,
	reverseWaypoints: true,
	showAlternatives: true,
	altLineOptions: {
		styles: [
			{color: 'black', opacity: 0.15, weight: 9},
			{color: 'white', opacity: 0.8, weight: 6},
			{color: 'blue', opacity: 0.5, weight: 2}
		]
	}
}).addTo(map);

new ErrorControl(control).addTo(map);