import * as L from 'leaflet';
import RoutingControl, { routingControl } from './control';
import Line, { line } from './line';
import OSRMv1, { osrmv1 } from './osrm-v1';
import Plan, { plan } from './plan';
import Waypoint, { waypoint } from './waypoint';
import Autocomplete, { autocomplete } from './autocomplete';
import Formatter, { formatter } from './formatter';
import GeocoderElement, { geocoderElement } from './geocoder-element';
import Localization, { localization } from './localization';
import ItineraryBuilder, { itineraryBuilder } from './itinerary-builder';
import ErrorControl, { errorControl } from './error-control';
import Mapbox, { mapbox } from './mapbox';
import {
  RouteEvent,
  RoutingErrorEvent,
  RoutingStartEvent,
  RoutesFoundEvent,
  WaypointGeocodedEvent,
  GeocodedEvent,
  LineTouchedEvent,
  WaypointDragEvent,
  WaypointsSplicedEvent
} from './common/types';

type RoutingHandler = {
  Control: typeof RoutingControl;
  Line: typeof Line;
  OSRMv1: typeof OSRMv1;
  Plan: typeof Plan;
  Waypoint: typeof Waypoint;
  Autocomplete: typeof Autocomplete;
  Formatter: typeof Formatter;
  GeocoderElement: typeof GeocoderElement;
  Localization: typeof Localization;
  ItineraryBuilder: typeof ItineraryBuilder;
  Mapbox: typeof Mapbox;

  control: (...args: ConstructorParameters<typeof RoutingControl>) => RoutingControl;
  line: (...args: ConstructorParameters<typeof Line>) => Line;
  plan: (...args: ConstructorParameters<typeof Plan>) => Plan;
  waypoint: (...args: ConstructorParameters<typeof Waypoint>) => Waypoint;
  osrmv1: (...args: ConstructorParameters<typeof OSRMv1>) => OSRMv1;
  localization: (...args: ConstructorParameters<typeof Localization>) => Localization;
  formatter: (...args: ConstructorParameters<typeof Formatter>) => Formatter;
  geocoderElement: (...args: ConstructorParameters<typeof GeocoderElement>) => GeocoderElement;
  itineraryBuilder: (...args: ConstructorParameters<typeof ItineraryBuilder>) => ItineraryBuilder;
  mapbox: (...args: ConstructorParameters<typeof Mapbox>) => Mapbox;
  errorControl: (...args: ConstructorParameters<typeof ErrorControl>) => ErrorControl;
  autocomplete: (...args: ConstructorParameters<typeof Autocomplete>) => Autocomplete;
};

declare module 'leaflet' {
  interface Evented {
    on(type: 'routeselected', fn: (e: RouteEvent) => void, context?: any): this;
    on(type: 'routingerror', fn: (e: RoutingErrorEvent) => void, context?: any): this;
    on(type: 'routingstart', fn: (e: RoutingStartEvent) => void, context?: any): this;
    on(type: 'routesfound', fn: (e: RoutesFoundEvent) => void, context?: any): this;
    on(type: 'waypointgeocoded', fn: (e: WaypointGeocodedEvent) => void, context?: any): this;
    on(type: 'waypointdrag', fn: (e: WaypointDragEvent) => void, context?: any): this;
    on(type: 'waypointdragstart', fn: (e: WaypointDragEvent) => void, context?: any): this;
    on(type: 'waypointdragend', fn: (e: WaypointDragEvent) => void, context?: any): this;
    on(type: 'waypointschanged', fn: (e: RoutingStartEvent) => void, context?: any): this;
    on(type: 'waypointsspliced', fn: (e: WaypointsSplicedEvent) => void, context?: any): this;
    on(type: 'geocoded', fn: (e: GeocodedEvent) => void, context?: any): this;
    on(type: 'reversegeocoded', fn: (e: GeocodedEvent) => void, context?: any): this;
    on(type: 'linetouched', fn: (e: LineTouchedEvent) => void, context?: any): this;

    off(type: 'routeselected', fn: (e: RouteEvent) => void, context?: any): this;
    off(type: 'routingerror', fn: (e: RoutingErrorEvent) => void, context?: any): this;
    off(type: 'routingstart', fn: (e: RoutingStartEvent) => void, context?: any): this;
    off(type: 'routesfound', fn: (e: RoutesFoundEvent) => void, context?: any): this;
    off(type: 'waypointgeocoded', fn: (e: WaypointGeocodedEvent) => void, context?: any): this;
    off(type: 'waypointdrag', fn: (e: WaypointDragEvent) => void, context?: any): this;
    off(type: 'waypointdragstart', fn: (e: WaypointDragEvent) => void, context?: any): this;
    off(type: 'waypointdragend', fn: (e: WaypointDragEvent) => void, context?: any): this;
    off(type: 'waypointschanged', fn: (e: RoutingStartEvent) => void, context?: any): this;
    off(type: 'waypointsspliced', fn: (e: WaypointsSplicedEvent) => void, context?: any): this;
    off(type: 'geocoded', fn: (e: GeocodedEvent) => void, context?: any): this;
    off(type: 'reversegeocoded', fn: (e: GeocodedEvent) => void, context?: any): this;
    off(type: 'linetouched', fn: (e: LineTouchedEvent) => void, context?: any): this;
  }

  let Routing: RoutingHandler;
}

const Routing: RoutingHandler = {
  Control: RoutingControl,
  Line: Line,
  OSRMv1: OSRMv1,
  Plan: Plan,
  Waypoint: Waypoint,
  Autocomplete: Autocomplete,
  Formatter: Formatter,
  GeocoderElement: GeocoderElement,
  Localization: Localization,
  ItineraryBuilder: ItineraryBuilder,
  Mapbox: Mapbox,

  control: routingControl,
  line,
  plan,
  waypoint,
  osrmv1,
  localization,
  formatter,
  geocoderElement,
  itineraryBuilder,
  mapbox,
  errorControl,
  autocomplete,
};

if (typeof window !== "undefined" && window.L) {
  window.L.Routing = Routing;
}

const Leaflet = L;
Leaflet.Routing = Routing;

export {
  RoutingControl,
  routingControl,
  Line,
  line,
  Plan,
  plan,
  Waypoint,
  waypoint,
  OSRMv1,
  osrmv1,
  Localization,
  localization,
  Formatter,
  formatter,
  GeocoderElement,
  geocoderElement,
  ItineraryBuilder,
  itineraryBuilder,
  Mapbox,
  mapbox,
  ErrorControl,
  errorControl,
  Autocomplete,
  autocomplete,
};