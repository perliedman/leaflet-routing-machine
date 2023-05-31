import L from 'leaflet';
import Line, { LineOptions } from './line';
import Plan, { PlanOptions } from './plan';
import OSRMv1, { OSRMv1Options } from './osrm-v1';
import { IRoute, IRouter, ItineraryEvents, RouteEvent, RoutesFoundEvent, RoutingErrorEvent, RoutingOptions, RoutingStartEvent } from './common/types';
import Waypoint from './waypoint';
import ItineraryBuilder, { ItineraryBuilderOptions } from './itinerary-builder';
import EventHub from './eventhub';

interface ControlOptions extends L.ControlOptions {
  /**
   * Determines whether the first route should automatically be selected
   */
  autoSelectFirstRoute?: boolean;
  /**
   * Style for the CircleMarkers used when hovering an itinerary instruction
   * @default { radius: 5, color: '#03f', fillColor: 'white', opacity: 1, fillOpacity: 0.7 }
   */
  pointMarkerStyle?: L.CircleMarkerOptions;
  /**
   * How the map’s view is fitted to a selected route result: smart will fit only if no waypoint is within the current view, or if the result covers a very small part of the view; other truthy values will always fit the map, falsy will never fit the map
   * @default 'smart'
   */
  fitSelectedRoutes?: 'smart' | boolean;
  /**
   * Function to create the map line when a route is presented on the map
   */
  routeLine?: (route: IRoute, options: LineOptions) => Line;
  /**
   * If true, route will automatically be calculated every time waypoints change, otherwise route() has to be called by the app
   * @default true
   */
  autoRoute?: boolean;
  /**
   * If true, routes will continually be calculated while the user drags waypoints, giving immediate feedback
   * @default false
   */
  routeWhileDragging?: boolean;
  /**
   * The minimum number of milliseconds between route calculations when waypoints are dragged
   * @default 500
   */
  routeDragInterval?: number;
  /**
   * Set to either connect (waypoints are connected by a line to the closest point on the calculated route) or snap (waypoints are moved to the closest point on the calculated route)
   * @default 'connect'
   */
  waypointMode?: 'connect' | 'snap';
  /**
   * If true, alternative polyline[s] will be shown on the map when available at the same time as the primary polyline
   * @default false
   */
  showAlternatives?: boolean;
  defaultErrorHandler?: (e: any) => void;
  /**
   * The router to use to calculate routes between waypoints
   * @default {@link OSRMv1}
   */
  router?: IRouter;
  routerOptions?: OSRMv1Options;
  /**
   * The plan to use to store and edit the route’s waypoints
   * @default {@link Plan}
   */
  plan?: Plan;
  planOptions?: PlanOptions;

  /**
   * Initial waypoints for the control
   * @default []
   */
  waypoints?: Waypoint[];
  addWaypoints?: boolean;
  /**
   * If true, route will be recalculated when the map is zoomed
   * @default false
   */
  useZoomParameter?: boolean;
  /**
   * Options passed when creating a new {@link Line} for showing alternative line[s], when showAlternatives is set to true. If not set and showAlternatives is true, alternative lines will be styled using {@link ControlOptions.lineOptions}
   */
  altLineOptions?: LineOptions;
  /**
   * Options passed when creating a new {@link Line}, for example styling
   */
  lineOptions?: LineOptions;
  itineraryBuilder?: ItineraryBuilder;
  itineraryBuilderOptions?: ItineraryBuilderOptions;
  eventHub?: EventHub<ItineraryEvents>;
}

interface ControlRoutingOptions extends RoutingOptions {
  zoom?: number;
  waypoints?: Waypoint[];
}

class RoutingControl {
  constructor(...args: any[]) {
  }
}

interface RoutingControl extends L.Control, L.Evented {
}
L.Util.extend(RoutingControl.prototype, L.Control.prototype);
L.Util.extend(RoutingControl.prototype, L.Evented.prototype);

/**
 * Combining the other classes into a full routing user interface. The main class of the plugin. Extends [L.Control](https://leafletjs.com/reference.html#control).
 * ## Usage example
 * 
 * ```typescript
 * var map = L.map('map');
 *
 * L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
 *  attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
 * }).addTo(map);
 *
 * L.Routing.control({
 *  waypoints: [
 *    L.latLng(57.74, 11.94),
 *    L.latLng(57.6792, 11.949)
 *  ]
 * }).addTo(map);
 * ```
 */
export default class Control extends RoutingControl {
  private readonly defaultOptions = {
    pointMarkerStyle: {
      radius: 5,
      color: '#03f',
      fillColor: 'white',
      opacity: 1,
      fillOpacity: 0.7
    },
    fitSelectedRoutes: 'smart',
    routeLine: (route: IRoute, options: LineOptions) => { return new Line(route, options); },
    autoRoute: true,
    routeWhileDragging: false,
    routeDragInterval: 500,
    waypointMode: 'connect',
    showAlternatives: false,
    autoSelectFirstRoute: true,
    defaultErrorHandler: (e: RoutingErrorEvent) => {
      console.error('Routing error:', e.error);
    }
  };

  controlOptions: ControlOptions;
  map?: L.Map;

  private router: IRouter;
  private plan: Plan;
  private requestCount: number;
  private selectedRoute?: IRoute;
  private line?: Line;
  private alternatives: Line[] = [];
  private routes: IRoute[] = [];
  private marker?: L.CircleMarker;
  private itineraryBuilder: ItineraryBuilder;
  private eventHub: EventHub<ItineraryEvents>;
  private pendingRequest: {
    request: Promise<IRoute[]>;
    abortController?: AbortController;
  } | null = null;

  constructor(options?: ControlOptions) {
    super(options);

    this.controlOptions = {
      ...this.defaultOptions as ControlOptions,
      ...options,
    };

    const { routeWhileDragging = this.defaultOptions.routeWhileDragging } = this.controlOptions;
    this.router = this.controlOptions.router || new OSRMv1(this.controlOptions.routerOptions);
    this.plan = this.controlOptions.plan || new Plan(this.controlOptions.waypoints || [], this.controlOptions.planOptions);
    this.eventHub = this.controlOptions.eventHub ?? new EventHub<ItineraryEvents>();
    this.itineraryBuilder = this.controlOptions.itineraryBuilder || new ItineraryBuilder(this.controlOptions.itineraryBuilderOptions);
    this.itineraryBuilder.registerEventHub(this.eventHub);
    this.requestCount = 0;

    if (this.controlOptions.defaultErrorHandler) {
      this.on('routingerror', this.controlOptions.defaultErrorHandler, this);
    }
    this.plan.on('waypointschanged', this.onWaypointsChanged, this);
    if (routeWhileDragging) {
      this.setupRouteDragging();
    }
  }

  onAdd(map: L.Map) {
    this.map = map;
    this.map.addLayer(this.plan);
    this.map.on('zoomend', this.onZoomEnd, this);
    this.eventHub.on('routeselected', (e) => this.routeSelected(e));
    this.eventHub.on('routesfound', (e) => this.routesFound(e));
    this.eventHub.on('altRowMouseOver', (coordinate) => {
      if (this.map) {
        this.marker = L.circleMarker(coordinate,
          this.controlOptions.pointMarkerStyle).addTo(this.map);
      }
    });
    this.eventHub.on('altRowMouseOut', () => {
      if (this.marker) {
        this.map?.removeLayer(this.marker);
        delete this.marker;
      }
    });
    this.eventHub.on('altRowClick', (coordinate) => {
      this.map?.panTo(coordinate);
    });

    const container = this.itineraryBuilder.buildItinerary(map.getSize().x <= 640);

    if (this.plan.options.geocoder) {
      container.insertBefore(this.plan.createGeocoders(), container.firstChild);
    }

    if (this.controlOptions.autoRoute) {
      this.route();
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
  }

  /**
   * @returns The waypoints of the control’s plan
   */
  getWaypoints() {
    return this.plan.getWaypoints();
  }

  /**
   * Sets the waypoints of the control’s plan
   */
  setWaypoints(waypoints: Waypoint[]) {
    this.plan.setWaypoints(waypoints);
    return this;
  }

  /**
   * Allows adding, removing or replacing waypoints in the control’s plan. Syntax is the same as in [Array#splice](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice).
   */
  spliceWaypoints(startIndex: number, deleteCount = 0, ...newWaypoints: Waypoint[]) {
    this.plan.spliceWaypoints(startIndex, deleteCount, ...newWaypoints);
  }

  /**
   * @returns The plan instance used by the control
   */
  getPlan() {
    return this.plan;
  }

  /**
   * @returns The router used by the control
   */
  getRouter() {
    return this.router;
  }

  routesFound(e: RoutesFoundEvent) {
    const routes = this.controlOptions.showAlternatives ? e.routes : [];

    this.updateLines(this.selectedRoute, routes);
    this.fitLineBounds();

    if (this.controlOptions.waypointMode === 'snap') {
      this.plan.off('waypointschanged', this.onWaypointsChanged, this);
      this.setWaypoints(e.waypoints);
      this.plan.on('waypointschanged', this.onWaypointsChanged, this);
    }
  }

  routeSelected(e: RouteEvent) {
    const { routeIndex } = e;
    const selectRoute = this.routes.find((r) => r.routesIndex === routeIndex);
    if (!selectRoute) {
      return;
    }

    const route = this.selectedRoute = selectRoute;
    const alternatives = this.controlOptions.showAlternatives ? this.routes.filter((r) => r.routesIndex !== routeIndex) : [];

    this.updateLines(route, alternatives);

    this.fitLineBounds();

    if (this.controlOptions.waypointMode === 'snap') {
      this.plan.off('waypointschanged', this.onWaypointsChanged, this);
      this.setWaypoints(route.waypoints);
      this.plan.on('waypointschanged', this.onWaypointsChanged, this);
    }
  }

  fitLineBounds() {
    const fitMode = this.controlOptions.fitSelectedRoutes;
    const fitBounds = (fitMode === 'smart' && !this.waypointsVisible()) || (fitMode !== 'smart' && fitMode);

    if (fitBounds && (this.line || this.alternatives.length)) {
      const bounds = (this.line ? [this.line] : []).concat(this.alternatives || []).map((l) => l.getBounds().getCenter());
      this.map?.fitBounds(L.latLngBounds(bounds));
    }
  }

  waypointsVisible() {
    if (!this.map) {
      return false;
    }

    const waypoints = this.getWaypoints().filter((waypoint) => waypoint.latLng);
    const { lat, lng } = this.map.getCenter();
    let bounds: L.Bounds = L.bounds([this.map.latLngToLayerPoint([lat, lng])]);

    try {
      const mapSize = this.map.getSize();

      for (const waypoint of waypoints) {
        const point = this.map.latLngToLayerPoint(waypoint.latLng!);

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

  waypointsInViewport() {
    if (!this.map) {
      return false;
    }

    try {
      const mapBounds = this.map.getBounds();
      return this.getWaypoints()
        .filter((waypoint) => waypoint.latLng)
        .some((waypoint) => mapBounds.contains(waypoint.latLng!));
    } catch (e) {
      return false;
    }
  }

  updateLines(route?: IRoute, alternatives: IRoute[] = []) {
    const { routeLine = this.defaultOptions.routeLine } = this.controlOptions;
    const addWaypoints = this.controlOptions.addWaypoints ?? true;
    this.clearLines();

    // add alternatives first so they lie below the main route
    this.alternatives = [];
    alternatives?.forEach((alt, i) => {
      this.alternatives[i] = routeLine(alt,
        {
          ...{
            isAlternative: true
          },
          ...(this.controlOptions.altLineOptions || this.controlOptions.lineOptions)
        });

      if (!this.map) {
        return;
      }

      this.alternatives[i].addTo(this.map);
      this.hookAltEvents(this.alternatives[i]);
    });

    if (!route || !this.map) {
      return;
    }

    this.line = routeLine(route,
      {
        ...{
          addWaypoints: addWaypoints,
          extendToWaypoints: this.controlOptions.waypointMode === 'connect'
        },
        ...this.controlOptions.lineOptions
      });

    this.line.addTo(this.map);
    this.hookEvents(this.line);
  }

  hookEvents(l: Line) {
    l.on('linetouched', (e) => {
      if (e.afterIndex < this.getWaypoints().length - 1) {
        this.plan.dragNewWaypoint(e);
      }
    });
  }

  hookAltEvents(l: Line) {
    l.on('linetouched', (e) => {
      this.eventHub.trigger('routeselected', { routeIndex: e.target.route.routesIndex });
    });
  }

  async onWaypointsChanged(e: RoutingStartEvent) {
    if (this.controlOptions.autoRoute) {
      await this.route({});
    }

    if (!this.plan.isReady()) {
      this.clearLines();
      this.itineraryBuilder.clearAlts();
    }

    this.fire('waypointschanged', { waypoints: e.waypoints });
  }

  setupRouteDragging() {
    let timer = 0;

    this.plan.on('waypointdrag', (e) => {
      const { waypoints } = e.target;

      if (!timer) {
        timer = window.setTimeout(async () => {
          const routes = await this.route({
            waypoints: waypoints,
            geometryOnly: true,
            customRouteTransform: true,
          });

          this.updateLineCallback(routes);

          clearTimeout(timer);
        }, this.controlOptions.routeDragInterval);
      }
    });

    this.plan.on('waypointdragend', async () => {
      if (timer) {
        clearTimeout(timer);
      }

      await this.route();
    });
  }

  updateLineCallback(routes: IRoute[]) {
    if (!this.selectedRoute) {
      return;
    }

    const alternatives = [...routes];
    const selected = alternatives.splice(this.selectedRoute.routesIndex, 1)[0];
    this.updateLines(
      selected,
      this.controlOptions.showAlternatives ? alternatives : []
    );
  }

  /**
   * Calculates the route between the current waypoints and presents in the itinerary, displaying the first result on the map
   */
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

        if (routeOptions?.customRouteTransform) {
          return routes;
        }

        // Prevent race among multiple requests,
        // by checking the current request's count
        // against the last request's; ignore result if
        // this isn't the last request.
        if (ts === this.requestCount) {
          this.clearLines();

          routes.forEach((route, i) => { route.routesIndex = i; });

          if (!routeOptions.geometryOnly) {
            this.fire('routesfound', { waypoints, routes: routes });
            this.itineraryBuilder.clearAlts();
            this.setAlternatives(routes);
          } else {
            this.routeSelected({ routeIndex: routes[0].routesIndex });
          }
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

  clearLines() {
    if (this.line) {
      this.map?.removeLayer(this.line);
      delete this.line;
    }
    for (const alternative of this.alternatives) {
      this.map?.removeLayer(alternative);
    }

    this.alternatives = [];
  }

  setAlternatives(routes: IRoute[]) {
    this.routes = routes;

    this.itineraryBuilder.setAlternatives(this.routes);
    if (this.controlOptions.autoSelectFirstRoute) {
      this.selectRoute({ routeIndex: this.routes[0].routesIndex });
    }

    return this;
  }

  selectRoute(e: RouteEvent) {
    if (this.marker) {
      this.map?.removeLayer(this.marker);
      delete this.marker;
    }
    this.eventHub.trigger('routeselected', e);
  }

  async onZoomEnd() {
    if (!this.selectedRoute || !this.router.requiresMoreDetail || !this.map) {
      return;
    }

    if (this.router.requiresMoreDetail(this.selectedRoute, this.map.getZoom(), this.map.getBounds())) {
      try {
        const routes = await this.route({
          simplifyGeometry: false,
          geometryOnly: true,
          customRouteTransform: true,
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
}

/**
 * Instantiates a new routing control with the provided options; unless specific router and/or plan instances are provided, options are also passed to their constructors
 */
export function routingControl(options?: ControlOptions) { 
  return new Control(options); 
}