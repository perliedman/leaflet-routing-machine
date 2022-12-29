import L from 'leaflet';
import { IRoute } from './common/types'

export interface LineOptions extends L.LayerOptions {
  /**
   * Can new waypoints be added by dragging the line
   * @default true
   */
  addWaypoints?: boolean;
  /**
   * The maximum distance between two waypoints before a non-routable line needs to be drawn
   * @default 10
   */
  missingRouteTolerance?: number;
  /**
   * If true, connects all waypoints, even if the route has a missing part
   * @default true
   */
  extendToWaypoints?: boolean;
  /**
   * Styles used for the line or lines drawn to represent the line
   * @defaultValue ```
   * [{ color: 'black', opacity: 0.15, weight: 9 }, { color: 'white', opacity: 0.8, weight: 6 }, { color: 'red', opacity: 1, weight: 2 }]
   * ```
   */
  styles?: L.PathOptions[];
  /**
   * Styles used for the line or lines drawn to connect waypoints to the closest point on the calculated route (the non-routable part)
   * @default [{ color: 'black', opacity: 0.15, weight: 7 } ,{ color: 'white', opacity: 0.6, weight: 4 }, { color: 'gray', opacity: 0.8, weight: 2, dashArray: '7,12' }]
   */
  missingRouteStyles?: L.PathOptions[];
}

class EventedLayerGroup {
  constructor(...args: any[]) {
  }
}

interface EventedLayerGroup extends L.LayerGroup, L.Evented { }
L.Util.extend(EventedLayerGroup.prototype, L.LayerGroup.prototype);
L.Util.extend(EventedLayerGroup.prototype, L.Evented.prototype);

/**
 * Displays a route on the map, and allows adding new waypoints by dragging the line.
 */
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

  constructor(route: IRoute, options?: LineOptions) {
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

  /**
   * Returns the bounds of the line
   */
  getBounds() {
    return L.latLngBounds(this.route.coordinates);
  }

  findWaypointIndices() {
    return this.route.inputWaypoints
      .filter((waypoint) => waypoint.latLng)
      .map((waypoint) => this.findClosestRoutePoint(waypoint.latLng!));
  }

  findClosestRoutePoint(latlng: L.LatLng) {
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

  extendToWaypoints() {
    const waypointIndices = this.getWaypointIndices();
    let waypointLatLng: L.LatLng;
    let routeCoordinates: L.LatLng;

    const {
      missingRouteTolerance = this.defaultOptions.missingRouteTolerance,
      missingRouteStyles = this.defaultOptions.missingRouteStyles
    } = this.options;

    for (const waypoint of this.route.inputWaypoints.filter((waypoint) => waypoint.latLng)) {
      waypointLatLng = waypoint.latLng!;
      const currentIndex = this.route.inputWaypoints.indexOf(waypoint);
      routeCoordinates = L.latLng(this.route.coordinates[waypointIndices[currentIndex]]);
      if (waypointLatLng.distanceTo(routeCoordinates) > missingRouteTolerance) {
        this.addSegment([waypointLatLng, routeCoordinates], missingRouteStyles);
      }
    }
  }

  addSegment(coords: L.LatLng[], styles: L.PathOptions[], mouselistener?: boolean) {
    for (const style of styles) {
      const polyline = L.polyline(coords, style);
      this.addLayer(polyline);
      if (mouselistener) {
        polyline.on('mousedown', this.onLineTouched, this);
      }
    }
  }

  findNearestWaypointBefore(index: number) {
    const waypointIndices = this.getWaypointIndices();
    let j = waypointIndices.length - 1;
    while (j >= 0 && waypointIndices[j] > index) {
      j--;
    }

    return j;
  }

  onLineTouched(e: L.LeafletMouseEvent) {
    const afterIndex = this.findNearestWaypointBefore(this.findClosestRoutePoint(e.latlng));
    this.fire('linetouched', {
      afterIndex: afterIndex,
      latlng: e.latlng
    });
    L.DomEvent.stop(e);
  }

  getWaypointIndices() {
    if (!this.waypointIndices.length) {
      this.waypointIndices = this.route.waypointIndices || this.findWaypointIndices();
    }

    return this.waypointIndices;
  }
}

/**
 * Instantiates a new line for the given route and provided options
 */
export function line(route: IRoute, options?: LineOptions) {
  return new Line(route, options);
}