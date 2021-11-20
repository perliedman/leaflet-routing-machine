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
	totalTime: number;
	totalDistance: number;
}

export interface IInstructionBase {
	distance: number;
	time: number;
	index: number;
	mode: string;
}

export interface ITextInstruction {
	text: string;
}

export interface IDirectionInstruction {
	type: InstructionType;
	road: string;
	direction: Direction;
	exit: number;
	modifier: InstructionType;
}

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
	name: string;
	summary: IRouteSummary;
	coordinates: L.LatLng[];
	waypoints: Waypoint[];
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
	 * attempt to route through the provided waypoints, where each waypoint is a [[Waypoint]]
	 */
	route: (waypoints: Waypoint[], options?: RoutingOptions, abortController?: AbortController) => Promise<IRoute[]>;
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
 * Fires when the control starts calculating a route; followed by either a [[RoutesFoundEvent]] or [[RoutingErrorEvent]] event
 * Fired when one or more waypoints change (added, deleted, moved)
 * @event
 */
export interface RoutingStartEvent {
	waypoints: Waypoint[];
}

/**
 * One or more routes where found
 * @event
 */
export interface RoutesFoundEvent extends RoutingStartEvent {
	routes: IRoute[];
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
}