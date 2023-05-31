import L from 'leaflet';
import Waypoint from '../../waypoint';

export enum InstructionType {
	Straight = 'Straight',
	SlightRight = 'SlightRight',
	Right = 'Right',
	SharpRight = 'SharpRight',
	TurnAround = 'TurnAround',
	SharpLeft = 'SharpLeft',
	Left = 'Left',
	SlightLeft = 'SlightLeft',
	WaypointReached = 'WaypointReached',
	Roundabout = 'Roundabout',
	StartAt = 'StartAt',
	DestinationReached = 'DestinationReached',
	EnterAgainstAllowedDirection = 'EnterAgainstAllowedDirection',
	LeaveAgainstAllowedDirection = 'LeaveAgainstAllowedDirection',
	Head = 'Head',
	Continue = 'Continue',
	Uturn = 'Uturn',
}

export enum Direction {
	N = 'N',
	NE = 'NE',
	E = 'E',
	SE = 'SE',
	S = 'S',
	SW = 'SW',
	W = 'W',
	NW = 'NW',
}

export interface IRouteSummary {
	/**
	 * estimated time for the route, in seconds
	 */
	totalTime: number;
	/**
	 * distance for the route, in meters
	 */
	totalDistance: number;
}

export interface IInstructionBase {
	/**
	 * distance in meters for this segment
	 */
	distance: number;
	/**
	 * estimated time in seconds for this segment
	 */
	time: number;
	index: number;
	mode: string;
}

export interface ITextInstruction {
	/**
	 * explicit instruction text
	 */
	text: string;
}

export interface IDirectionInstruction {
	/**
	 *  	one of the enumerated instruction types (see below)
	 */
	type: InstructionType;
	/**
	 * name of road for this segment, if available
	 */
	road: string;
	/**
	 * aproximate compass direction: N, NE, E, SE, S, SW, W, NW
	 */
	direction: Direction;
	/**
	 * for roundabouts, designates the number of the exit to take
	 */
	exit: number;
	modifier: InstructionType;
}

/**
 * Describes a part of a route’s itinerary, such as a turn.
 * Can be of two types: either a text property containing the exact text to be shown to the user, a number of properties that describe the instruction in an abstract form; the latter can later be translated to different languages, while explicit text can’t.
 */
export type IInstruction = IInstructionBase & (ITextInstruction | IDirectionInstruction);

export interface RoutingOptions {
	alternatives?: boolean;
	steps?: boolean;
	/**
	 * Current zoom level when the request was made
	 */
	zoom?: number;
	/**
	 * If U-turns are allowed in this route (might only be applicable for OSRM backend)
	 */
	allowUTurns?: boolean;
	/**
	 * If true, try to save bandwidth by just giving the route geometry; also, multiple results are not required (typically used for route preview when dragging a waypoint)
	 * @default false
	 */
	geometryOnly?: boolean;
	/**
	 * Fileformat to return
	 */
	fileFormat?: string;
	simplifyGeometry?: boolean;
	customRouteTransform?: boolean;
}

export interface IRoute {
	/**
	 * a descriptive name for this route
	 */
	name: string;
	/**
	 * summary of the route
	 */
	summary: IRouteSummary;
	/**
	 * an array of [L.LatLng](https://leafletjs.com/reference.html#latlng)s that can be used to visualize the route; the level of detail should be high, since Leaflet will simplify the line appropriately when it is displayed
	 */
	coordinates: L.LatLng[];
	/**
	 * the waypoints for this route
	 */
	waypoints: Waypoint[];
	/**
	 * instructions for this route
	 */
	instructions: IInstruction[];
	inputWaypoints: Waypoint[];
	waypointIndices?: number[];
	properties: {
		isSimplified: boolean;
	};
	routesIndex: number;
}

export interface IRoutingError {
	message: string;
	status: number;
	url?: string;
	target?: any;
}

export interface IRouter {
	/**
	 * attempt to route through the provided waypoints, where each waypoint is a {@link Waypoint}
	 */
	route: (waypoints: Waypoint[], options?: RoutingOptions, abortController?: AbortController) => Promise<IRoute[]>;
	/**
	 * Indicates whether a route would become incomplete because some waypoints are out of bounds due to zoom. If true, triggers a reroute
	 */
	requiresMoreDetail?: (route: IRoute, zoom: number, bounds: L.LatLngBounds) => boolean;
}

export interface RouteEvent {
	routeIndex: number;
}

/**
 * An error occured while calculating the route between waypoints
 * @event
 */
export interface RoutingErrorEvent {
	error: any
}

/**
 * One or more routes were found
 * @event
 */
export interface RoutesFoundEvent extends RoutingStartEvent {
	routes: IRoute[];
}

/**
 * Fires when the control starts calculating a route; followed by either a {@link RoutesFoundEvent} or {@link RoutingErrorEvent} event
 * Fired when one or more waypoints change (added, deleted, moved)
 * @event
 */
export interface RoutingStartEvent {
	waypoints: Waypoint[];
}

export interface WaypointEvent {
	waypoint: Waypoint;
}

/**
 * Fired when a waypoint is geocoded or reverse geocoded
 * @event
 */
export interface WaypointGeocodedEvent extends WaypointEvent {
	waypointIndex: number;
}

export interface GeocodedEvent extends WaypointEvent {
	value: string;
}

/**
 * Fires when the line is touched (tapped or clicked)
 * @event
 */
export interface LineTouchedEvent extends L.LeafletEvent {
	afterIndex: number;
	latlng: L.LatLng;
}

export interface WaypointDragEvent {
	target: any;
	index: number;
	latlng: L.LatLng;
}

/**
 * Also fired when waypoints changed, but includes more finegrained details on actual changes, like a call to [Array.splice](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice)
 * @event
 */
export interface WaypointsSplicedEvent {
	index: number;
	nRemoved: number;
	added: Waypoint[];
}

export type ItineraryEvents = {
	altRowMouseOver: L.LatLng;
	altRowClick: L.LatLng;
	altRowMouseOut: L.LatLng;
	routeselected: RouteEvent;
	routesfound: RoutesFoundEvent;
}