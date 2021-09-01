import L from 'leaflet';
import RoutingControl from './control';
import Itinerary from './itinerary';
import Line from './line';
import OSRMv1 from './osrm-v1';
import Plan from './plan';
import Waypoint from './waypoint';
import Autocomplete from './autocomplete';
import Formatter from './formatter';
import GeocoderElement from './geocoder-element';
import Localization from './localization';
import ItineraryBuilder from './itinerary-builder';
import ErrorControl from './error-control';
import Mapbox from './mapbox';
import {
    RouteEvent,
    RoutingErrorEvent,
    RoutingStartEvent,
    RoutesFoundEvent,
    WaypointGeocodedEvent,
    GeocodedEvent,
    LineTouchedEvent,
    WaypointDragEvent
} from './common/types';

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
		off(type: 'geocoded', fn: (e: GeocodedEvent) => void, context?: any): this;
		off(type: 'reversegeocoded', fn: (e: GeocodedEvent) => void, context?: any): this;
		off(type: 'linetouched', fn: (e: LineTouchedEvent) => void, context?: any): this;
	}
    
    let Routing: {
        Control: typeof RoutingControl;
        Itinerary: typeof Itinerary;
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
        itinerary: (...args: ConstructorParameters<typeof Itinerary>) => Itinerary;
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
}

L.Routing = {
    Control: RoutingControl,
    Itinerary: Itinerary,
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

    control: function(options) { return new RoutingControl(options); },
    itinerary: function(options) {
        return new Itinerary(options);
    },
    line: function(route, options) {
        return new Line(route, options);
    },
    plan: function(waypoints, options) {
        return new Plan(waypoints, options);
    },
    waypoint: function(latLng, name, options) {
        return new Waypoint(latLng, name, options);
    },
    osrmv1: function(options) {
        return new OSRMv1(options);
    },
    localization: function(options) {
        return new Localization(options);
    },
    formatter: function(options) {
        return new Formatter(options);
    },
    geocoderElement: function(wp, i, nWps, plan) {
        return new GeocoderElement(wp, i, nWps, plan);
    },
    itineraryBuilder: function(options) {
        return new ItineraryBuilder(options);
    },
    mapbox: function(accessToken, options) {
        return new Mapbox(accessToken, options);
    },
    errorControl: function(routingControl, options) {
        return new ErrorControl(routingControl, options);
    },
    autocomplete: function(elem, callback, options) {
        return new Autocomplete(elem, callback, options);
    }
};
