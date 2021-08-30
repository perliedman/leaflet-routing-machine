import L from 'leaflet';

interface WaypointOptions {
	allowUTurn?: boolean;
}

export default class Waypoint extends L.Class {
	options: WaypointOptions = {
		allowUTurn: false
	}

	latLng: L.LatLng;
	name?: string;

	constructor(latLng: L.LatLngExpression, name?: string, options?: WaypointOptions) {
		super();

		this.options = {
			...this.options,
			...options,
		};

		this.latLng = L.latLng(latLng);
		this.name = name;
	}
}
