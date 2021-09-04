import L from 'leaflet';
import { IRoute } from './common/types'

export interface LineOptions extends L.LayerOptions {
	addWaypoints?: boolean;
	missingRouteTolerance?: number;
	extendToWaypoints?: boolean;
	styles?: L.PathOptions[];
	missingRouteStyles?: L.PathOptions[];
}

class EventedLayerGroup {
  constructor(...args: any[]) {
  }
}

interface EventedLayerGroup extends L.LayerGroup, L.Evented {}
L.Util.extend(EventedLayerGroup.prototype, L.LayerGroup.prototype);
L.Util.extend(EventedLayerGroup.prototype, L.Evented.prototype);

export default class Line extends L.LayerGroup {
	private readonly defaultOptions = {
		styles: [
			{ color: 'black', opacity: 0.15, weight: 9 },
			{ color: 'white', opacity: 0.8, weight: 6 },
			{ color: 'red', opacity: 1, weight: 2 }
		],
		missingRouteStyles: [
			{ color: 'black', opacity: 0.15, weight: 7 },
			{ color: 'white', opacity: 0.6, weight: 4 },
			{ color: 'gray', opacity: 0.8, weight: 2, dashArray: '7,12' }
		],
		addWaypoints: true,
		extendToWaypoints: true,
		missingRouteTolerance: 10
	}

	options: LineOptions;

	private route: IRoute;
	private waypointIndices: number[] = [];

	constructor(route: IRoute, options: LineOptions) {
		super();

		this.options = {
			...this.defaultOptions,
			...options,
		}

		this.route = route;

		if (this.options.extendToWaypoints) {
			this.extendToWaypoints();
		}

		this.addSegment(
			route.coordinates,
			this.options.styles ?? this.defaultOptions.styles,
			this.options.addWaypoints);
	}

	getBounds() {
		return L.latLngBounds(this.route.coordinates);
	}

	private findWaypointIndices() {
		return this.route.inputWaypoints.map((waypoint) => this.findClosestRoutePoint(waypoint.latLng));
	}

	private findClosestRoutePoint(latlng: L.LatLng) {
		let minDist = Number.MAX_VALUE;
		let minIndex = 0;
		let distance: number;

		for (const coordinate of this.route.coordinates.reverse()) {
			// TODO: maybe do this in pixel space instead?
			distance = latlng.distanceTo(coordinate);
			if (distance < minDist) {
				minIndex = this.route.coordinates.indexOf(coordinate);
				minDist = distance;
			}
		}

		return minIndex;
	}

	private extendToWaypoints() {
		const waypointIndices = this.getWaypointIndices();
		let waypointLatLng: L.LatLng;
		let routeCoordinates: L.LatLng;

		const {
			missingRouteTolerance = this.defaultOptions.missingRouteStyles,
			missingRouteStyles = this.defaultOptions.missingRouteStyles
		} = this.options;

		for (const waypoint of this.route.inputWaypoints) {
			waypointLatLng = waypoint.latLng;
			const currentIndex = this.route.inputWaypoints.indexOf(waypoint);
			routeCoordinates = L.latLng(this.route.coordinates[waypointIndices[currentIndex]]);
			if (waypointLatLng.distanceTo(routeCoordinates) > missingRouteTolerance) {
				this.addSegment([waypointLatLng, routeCoordinates], missingRouteStyles);
			}
		}
	}

	private addSegment(coords: L.LatLng[], styles: L.PathOptions[], mouselistener?: boolean) {
		for (const style of styles) {
			const polyline = L.polyline(coords, style);
			this.addLayer(polyline);
			if (mouselistener) {
				polyline.on('mousedown', this.onLineTouched, this);
			}
		}
	}

	private findNearestWaypointBefore(index: number) {
		const waypointIndices = this.getWaypointIndices();
		let j = waypointIndices.length - 1;
		while (j >= 0 && waypointIndices[j] > index) {
			j--;
		}

		return j;
	}

	private onLineTouched(e: L.LeafletMouseEvent) {
		const afterIndex = this.findNearestWaypointBefore(this.findClosestRoutePoint(e.latlng));
		this.fire('linetouched', {
			afterIndex: afterIndex,
			latlng: e.latlng
		});
		L.DomEvent.stop(e);
	}

	private getWaypointIndices() {
		if (!this.waypointIndices.length) {
			this.waypointIndices = this.route.waypointIndices || this.findWaypointIndices();
		}

		return this.waypointIndices;
	}
}
