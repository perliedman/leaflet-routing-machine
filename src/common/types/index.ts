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
	N,
	NE,
	E,
	SE,
	S,
	SW,
	W,
	NW,
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
	zoom?: number;
	allowUTurns?: boolean;
	geometryOnly?: boolean;
	fileFormat?: string;
	simplifyGeometry?: boolean;
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
	routesIndex?: number;
}

export interface IRoutingError {
	message: string;
	status: number;
	url?: string;
	target?: any;
}

export interface IRouter {
	route: (waypoints: Waypoint[], options?: RoutingOptions, abortController?: AbortController) => Promise<IRoute[]>;
	requiresMoreDetail?: (route: IRoute, zoom: number, bounds: L.LatLngBounds) => boolean;
}

export interface RouteEvent {
	route: IRoute;
	alternatives: IRoute[];
}

export interface RoutingErrorEvent {
	error: any
}

export interface RoutingStartEvent {
	waypoints: Waypoint[];
}

export interface RoutesFoundEvent extends RoutingStartEvent {
	routes: IRoute[];
}

export interface WaypointEvent {
	waypoint: Waypoint;
}

export interface WaypointGeocodedEvent extends WaypointEvent {
	waypointIndex: number;
}

export interface GeocodedEvent extends WaypointEvent {
	value: string;
}