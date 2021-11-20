import L from 'leaflet';

interface WaypointOptions {
  /**
   * When using OSRM for routing, allow U-turn at this waypoint
   * @default false
   */
  allowUTurn?: boolean;
}

/**
 * A specific waypoint on a route
 */
export default class Waypoint extends L.Class {
  options: WaypointOptions = {
    allowUTurn: false
  }

  latLng: L.LatLng | null;
  name?: string;

  constructor(latLng?: L.LatLngExpression, name?: string, options?: WaypointOptions) {
    super();

    this.options = {
      ...this.options,
      ...options,
    };

    this.latLng = latLng ? L.latLng(latLng) : null;
    this.name = name;
  }
}

/**
 * Utility function to create a new waypoint
 */
export function waypoint(latLng?: L.LatLngExpression, name?: string, options?: WaypointOptions) {
  return new Waypoint(latLng, name, options);
}