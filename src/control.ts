import L from 'leaflet';
import Line, { LineOptions } from './line';
import Plan from './plan';
import OSRMv1 from './osrm-v1';
import Itinerary, { ItineraryOptions } from './itinerary';
import { IRoute, IRouter, RouteEvent, RoutingErrorEvent, RoutingOptions, RoutingStartEvent } from './common/types';
import Waypoint from './waypoint';

interface ControlOptions extends ItineraryOptions {
	fitSelectedRoutes?: 'smart' | boolean;
	routeLine?: (route: IRoute, options: LineOptions) => Line;
	autoRoute?: boolean;
	routeWhileDragging?: boolean;
	routeDragInterval?: number;
	waypointMode?: 'connect' | 'snap';
	showAlternatives?: boolean;
	defaultErrorHandler?: (e: any) => void;
	router?: IRouter;
	plan?: Plan;
	waypoints?: Waypoint[];
	addWaypoints?: boolean;
	useZoomParameter?: boolean;
	altLineOptions?: LineOptions;
	lineOptions?: LineOptions;
}

interface ControlRoutingOptions extends RoutingOptions {
	zoom?: number;
	waypoints?: Waypoint[];
}

export default class Control extends Itinerary {
	private readonly defaultControlOptions = {
		fitSelectedRoutes: 'smart',
		routeLine: (route: IRoute, options: LineOptions) => { return new Line(route, options); },
		autoRoute: true,
		routeWhileDragging: false,
		routeDragInterval: 500,
		waypointMode: 'connect',
		showAlternatives: false,
		defaultErrorHandler: (e: RoutingErrorEvent) => {
			console.error('Routing error:', e.error);
		}
	};

	controlOptions: ControlOptions;

	private router: IRouter;
	private plan: Plan;
	private requestCount: number;
	private selectedRoute?: IRoute;
	private line?: Line;
	private alternatives: Line[] = [];
	private pendingRequest: {
		request: Promise<IRoute[]>;
		abortController?: AbortController;
	} | null = null;


	constructor(options?: ControlOptions) {
		super(options);

		this.controlOptions = {
			...this.defaultControlOptions as ControlOptions,
			...this.options,
			...options,
		};

		const { routeWhileDragging = this.defaultControlOptions.routeWhileDragging } = this.controlOptions;
		this.router = this.controlOptions.router || new OSRMv1(options);
		this.plan = this.controlOptions.plan || new Plan(this.controlOptions.waypoints || [], options);
		this.requestCount = 0;

		this.on('routeselected', this.routeSelected, this);
		if (this.controlOptions.defaultErrorHandler) {
			this.on('routingerror', this.controlOptions.defaultErrorHandler, this);
		}
		this.plan.on('waypointschanged', this.onWaypointsChanged, this);
		if (routeWhileDragging) {
			this.setupRouteDragging();
		}
	}

	private async onZoomEnd() {
		if (!this.selectedRoute || !this.router.requiresMoreDetail || !this.map) {
			return;
		}

		if (this.router.requiresMoreDetail(this.selectedRoute, this.map.getZoom(), this.map.getBounds())) {
			try {
				const routes = await this.route({
					simplifyGeometry: false,
					geometryOnly: true
				});

				for (const route of routes) {
					const i = routes.indexOf(route);
					this.routes[i].properties = routes[i].properties;
				}

				this.updateLineCallback(routes);
			} catch (err: any) {
				if (err.type !== 'abort') {
					this.clearLines();
				}
			}
		}
	}

	onAdd(map: L.Map) {
		if (this.controlOptions.autoRoute) {
			this.route();
		}

		const container = super.onAdd(map);

		this.map = map;
		this.map.addLayer(this.plan);

		this.map.on('zoomend', this.onZoomEnd, this);

		if (this.plan.options.geocoder) {
			container.insertBefore(this.plan.createGeocoders(), container.firstChild);
		}

		return container;
	}

	onRemove(map: L.Map) {
		map.off('zoomend', this.onZoomEnd, this);
		if (this.line) {
			map.removeLayer(this.line);
		}

		map.removeLayer(this.plan);
		for (const alternative of this.alternatives) {
			map.removeLayer(alternative);
		}

		super.onRemove(map);
	}

	getWaypoints() {
		return this.plan.getWaypoints();
	}

	setWaypoints(waypoints: Waypoint[]) {
		this.plan.setWaypoints(waypoints);
		return this;
	}

	spliceWaypoints(startIndex: number, deleteCount: number = 0, ...newWaypoints: Waypoint[]) {
		this.plan.spliceWaypoints(startIndex, deleteCount, ...newWaypoints);
	}

	getPlan() {
		return this.plan;
	}

	getRouter() {
		return this.router;
	}

	private routeSelected(e: RouteEvent) {
		const route = this.selectedRoute = e.route;
		const alternatives = this.controlOptions.showAlternatives ? e.alternatives : [];
		const fitMode = this.controlOptions.fitSelectedRoutes;
		const fitBounds =
				(fitMode === 'smart' && !this.waypointsVisible()) ||
				(fitMode !== 'smart' && fitMode);

		this.updateLines({ route, alternatives });

		if (fitBounds && this.map && this.line) {
			this.map.fitBounds(this.line.getBounds());
		}

		if (this.controlOptions.waypointMode === 'snap') {
			this.plan.off('waypointschanged', this.onWaypointsChanged, this);
			this.setWaypoints(route.waypoints);
			this.plan.on('waypointschanged', this.onWaypointsChanged, this);
		}
	}

	private waypointsVisible() {
		if (!this.map) {
			return false;
		}

		const waypoints = this.getWaypoints();
		const { lat, lng } = this.map.getCenter();
		let bounds: L.Bounds = L.bounds([this.map.latLngToLayerPoint([lat, lng])]);

		try {
			const mapSize = this.map.getSize();

			for (const waypoint of waypoints) {
				const point = this.map.latLngToLayerPoint(waypoint.latLng);

				if (bounds) {
					bounds.extend(point);
				} else {
					bounds = L.bounds([point]);
				}
			}

			const boundsSize = bounds.getSize();
			return (boundsSize.x > mapSize.x / 5 || boundsSize.y > mapSize.y / 5) && this.waypointsInViewport();
		} catch (e) {
			return false;
		}
	}

	private waypointsInViewport() {
		if (!this.map) {
			return false;
		}

		try {
			const mapBounds = this.map.getBounds();
			return this.getWaypoints().some((waypoint) => mapBounds.contains(waypoint.latLng));
		} catch (e) {
			return false;
		}
	}

	private updateLines(routes: RouteEvent) {
		const { routeLine = this.defaultControlOptions.routeLine } = this.controlOptions;
		const addWaypoints = this.controlOptions.addWaypoints ?? true;
		this.clearLines();

		// add alternatives first so they lie below the main route
		this.alternatives = [];
		routes.alternatives?.forEach((alt, i) => {
			this.alternatives[i] = routeLine(alt,
				{...{
					isAlternative: true
				}, ...this.controlOptions.altLineOptions || this.controlOptions.lineOptions});
			
			if (!this.map) {
				return;
			}
			this.alternatives[i].addTo(this.map);
			this.hookAltEvents(this.alternatives[i]);
		});

		this.line = routeLine(routes.route,
			{...{
				addWaypoints: addWaypoints,
				extendToWaypoints: this.controlOptions.waypointMode === 'connect'
			}, ...this.controlOptions.lineOptions});

		if (!this.map) {
			return;
		}
		this.line.addTo(this.map);
		this.hookEvents(this.line);
	}

	private hookEvents(l: Line) {
		l.on('linetouched', (e) => {
			if (e.afterIndex < this.getWaypoints().length - 1) {
				this.plan.dragNewWaypoint(e);
			}
		});
	}

	private hookAltEvents(l: Line) {
		l.on('linetouched', (e) => {
			const alts = this.routes.slice();
			const selected = alts.splice(e.target.route.routesIndex, 1)[0];
			this.fire('routeselected', { route: selected, alternatives: alts });
		});
	}

	private onWaypointsChanged(e: RoutingStartEvent) {
		if (this.controlOptions.autoRoute) {
			this.route({});
		}

		if (!this.plan.isReady()) {
			this.clearLines();
			this.clearAlts();
		}

		this.fire('waypointschanged', { waypoints: e.waypoints });
	}

	private setupRouteDragging() {
		let timer = 0;

		this.plan.on('waypointdrag', (e) => {
			const { waypoints } = e.target;

			if (!timer) {
				timer = setTimeout(async () => {
					const routes = await this.route({
						waypoints: waypoints,
						geometryOnly: true,
					});

					this.updateLineCallback(routes);
					
					clearTimeout(timer);
				}, this.controlOptions.routeDragInterval);
			}
		});
		this.plan.on('waypointdragend', () => {
			if (timer) {
				clearTimeout(timer);
			}
			this.route();
		});
	}

	private updateLineCallback(routes: IRoute[]) {
		if (!this.selectedRoute) {
			return;
		}

		const selected = [...routes].splice(this.selectedRoute.routesIndex, 1)[0];
		this.updateLines({
			route: selected,
			alternatives: this.controlOptions.showAlternatives ? routes : []
		});
	}

	async route(options?: ControlRoutingOptions) {
		const ts = ++this.requestCount;

		if (this.pendingRequest?.abortController) {
			setTimeout(() => {
				this.pendingRequest?.abortController?.abort();
				this.pendingRequest = null;
			}, 1000)
		}

		const routeOptions = options || {};

		if (this.plan.isReady()) {
			if (this.controlOptions.useZoomParameter) {
				routeOptions.zoom = this.map?.getZoom();
			}

			const waypoints = routeOptions.waypoints || this.plan.getWaypoints();
			this.fire('routingstart', { waypoints });
			
			const controller = new AbortController();
			this.pendingRequest = {
				request: this.router.route(waypoints, routeOptions, controller),
				abortController: controller,
			};

			try {
				const routes = await this.pendingRequest.request;
				this.pendingRequest = null;

				// Prevent race among multiple requests,
				// by checking the current request's count
				// against the last request's; ignore result if
				// this isn't the last request.
				if (ts === this.requestCount) {
					this.clearLines();
					this.clearAlts();

					routes.forEach(function(route, i) { route.routesIndex = i; });

					if (!routeOptions.geometryOnly) {
						this.fire('routesfound', { waypoints, routes: routes });
						this.setAlternatives(routes);
					} else {
						const selectedRoute = routes.splice(0, 1)[0];
						this.routeSelected({ route: selectedRoute, alternatives: routes });
					}

					return routes;
				}
			} catch (err: any) {
				if (err?.type !== 'abort') {
					this.fire('routingerror', { error: err });
				}
			} finally {
				this.pendingRequest = null;
			}
		}

		return [];
	}

	private clearLines() {
		if (this.line) {
			this.map?.removeLayer(this.line);
			delete this.line;
		}
		for (const alternative of this.alternatives) {
			this.map?.removeLayer(alternative);
		}

		this.alternatives = [];
	}
}