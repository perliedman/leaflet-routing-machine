import L from 'leaflet';

interface WaypointOptions {
  allowUTurn?: boolean;
}

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

export function waypoint(latLng?: L.LatLngExpression, name?: string, options?: WaypointOptions) {
  return new Waypoint(latLng, name, options);
}