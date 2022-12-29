import L from 'leaflet';
import { decode } from '@googlemaps/polyline-codec';
import Waypoint from './waypoint';
import { Direction, RoutingOptions, IRouter, IRoute, IRoutingError, InstructionType } from './common/types';

export interface OSRMv1Options {
  /**
   * Router service URL
   * @default https://router.project-osrm.org/route/v1
   */
  serviceUrl?: string;
  /**
   * The OSRM profile to use in requests
   * @default 'driving'
   */
  profile?: string;
  /**
   * Number of milliseconds before a route calculation times out, returning an error to the routing callback
   * @default 30000
   */
  timeout?: number;
  routingOptions?: RoutingOptions;
  /**
   * The precision to use when decoding polylines in responses from OSRM
   * @default 5
   */
  polylinePrecision?: number;
  /**
   * Whether hints should be included in server requests
   * @default true
   */
  useHints?: boolean;
  suppressDemoServerWarning?: boolean;
  language?: string;
  requestParameters?: any;
  stepToText?: (language: string | undefined, step: OSRMStep, properties: { legCount: number, legIndex: number }) => string;
}

interface OSRMWaypoint {
  hint: string;
  distance: number;
  location: [number, number];
  name: string;
}

interface OSRMIntersection {
  in?: number;
  out: number;
  entry: boolean[];
  location: [number, number];
  bearings: number[];
}

interface OSRMManeuver {
  bearing_after: number;
  location: [number, number];
  type: string;
  bearing_before: number;
  modifier: InstructionType;
  exit: number;
}

interface OSRMStep {
  intersections: OSRMIntersection[];
  driving_side: 'right' | 'left';
  geometry: string;
  duration: number;
  distance: number;
  name: string;
  weight: number;
  mode: string;
  maneuver: OSRMManeuver;
}

interface OSRMLeg {
  steps: OSRMStep[];
  weight: number;
  distance: number;
  summary: string;
  duration: number;
}

interface OSRMRoute {
  legs: OSRMLeg[];
  weight: number;
  distance: number;
  weight_name: string;
  duration: number;
  geometry: string;
}

interface OSRMResult {
  code: string;
  waypoints: OSRMWaypoint[];
  routes: OSRMRoute[];
}

/**
 * Handles communication with the OSRM backend, building the request and parsing the response. Implements {@link IRouter}.
 * Note that this class supports the OSRM HTTP API v1, that is included with OSRM version 5 and up. OSRM 4 used another API that is not supported by this class.
 * See [OSRM HTTP API](https://github.com/Project-OSRM/osrm-backend/blob/master/docs/http.md) for the specification this implementation is built on.
 */
export default class OSRMv1 extends L.Class implements IRouter {
  private readonly defaultOptions = {
    serviceUrl: 'https://router.project-osrm.org/route/v1',
    profile: 'driving',
    timeout: 30 * 1000,
    routingOptions: {
      alternatives: true,
      steps: true
    },
    polylinePrecision: 5,
    useHints: true,
    suppressDemoServerWarning: false,
    language: 'en',
  };

  options: OSRMv1Options;

  private hints: {
    locations: { [key: string]: string };
  };

  constructor(options?: OSRMv1Options) {
    super();

    this.options = {
      ...this.defaultOptions,
      ...options,
    };

    this.hints = {
      locations: {}
    };

    if (!this.options.suppressDemoServerWarning &&
      (this.options.serviceUrl?.indexOf('//router.project-osrm.org') ?? 0) >= 0) {
      console.warn('You are using OSRM\'s demo server. ' +
        'Please note that it is **NOT SUITABLE FOR PRODUCTION USE**.\n' +
        'Refer to the demo server\'s usage policy: ' +
        'https://github.com/Project-OSRM/osrm-backend/wiki/Api-usage-policy\n\n' +
        'To change, set the serviceUrl option.\n\n' +
        'Please do not report issues with this server to neither ' +
        'Leaflet Routing Machine or OSRM - it\'s for\n' +
        'demo only, and will sometimes not be available, or work in ' +
        'unexpected ways.\n\n' +
        'Please set up your own OSRM server, or use a paid service ' +
        'provider for production.');
    }
  }

  async route(waypoints: Waypoint[], options?: RoutingOptions, abortController?: AbortController) {
    const routingOptions = { ...this.options.routingOptions, ...options };
    let url = this.buildRouteUrl(waypoints, routingOptions);
    if (this.options.requestParameters) {
      url += L.Util.getParamString(this.options.requestParameters, url);
    }

    // Create a copy of the waypoints, since they
    // might otherwise be asynchronously modified while
    // the request is being processed.
    const wps = [...waypoints];

    const error: IRoutingError = {
      message: '',
      status: 0,
    };

    const request = fetch(url, {
      signal: abortController?.signal,
    });

    try {
      const timeout = this.options.timeout ?? this.defaultOptions.timeout;
      const response = await Promise.race([
        request,
        new Promise<undefined>((_, reject) => window.setTimeout(() => reject(new Error('timeout')), timeout))
      ]);

      if (response?.ok) {
        try {
          const data: OSRMResult = await response.json();

          if (data.code !== 'Ok') {
            throw {
              message: data.code,
              status: -1,
            };
          }

          try {
            return this.routeDone(data, wps, routingOptions);
          } catch (ex: any) {
            error.status = -3;
            error.message = ex.toString();
          }
        } catch (ex: any) {
          error.status = -2;
          error.message = 'Error parsing OSRM response: ' + ex.toString();
        }
      } else {
        throw {
          target: request
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message === 'timeout') {
        throw {
          type: 'abort',
          status: -1,
          message: 'OSRM request timed out.'
        };
      }

      const errorStatus = (err.target?.status ? ` HTTP ${err.target.status}: ${err.target.statusText}` : '');
      let message = `${err.type}${errorStatus}`;
      if (err.responseText) {
        try {
          const data = JSON.parse(err.responseText);
          if (data.message) {
            message = data.message;
          }
        } catch (ex) {
          message = 'Error parsing error response';
        }
      }

      error.message = 'HTTP request failed: ' + message;
      error.url = url;
      error.status = -1;
      error.target = err;
    }

    throw error;
  }

  requiresMoreDetail(route: IRoute, zoom: number, bounds: L.LatLngBounds) {
    if (!route.properties.isSimplified) {
      return false;
    }

    return route.inputWaypoints
      .filter((waypoint) => waypoint.latLng)
      .some((waypoint) => !bounds.contains(waypoint.latLng!));
  }

  private routeDone(response: OSRMResult, inputWaypoints: Waypoint[], options?: RoutingOptions) {
    const actualWaypoints = this.toWaypoints(inputWaypoints, response.waypoints);
    const alts = response.routes.map((route) => {
      const isSimplified = (!options?.geometryOnly || options?.simplifyGeometry) ?? false;
      return this.convertRoute(route, inputWaypoints, actualWaypoints, isSimplified);
    });

    this.saveHintData(response.waypoints, inputWaypoints);

    return alts;
  }

  private convertRoute(responseRoute: OSRMRoute, inputWaypoints: Waypoint[], actualWaypoints: Waypoint[], isSimplified: boolean) {
    const result: IRoute = {
      name: '',
      coordinates: [],
      instructions: [],
      summary: {
        totalDistance: responseRoute.distance,
        totalTime: responseRoute.duration
      },
      inputWaypoints,
      waypoints: actualWaypoints,
      properties: {
        isSimplified
      },
      waypointIndices: [],
      routesIndex: 0
    };

    const { language = this.defaultOptions.language, stepToText } = this.options;
    const legNames: string[] = [];
    const waypointIndices: number[] = [];
    const legCount = responseRoute.legs.length;
    const hasSteps = responseRoute.legs[0].steps.length > 0;
    let index = 0;

    for (const leg of responseRoute.legs) {
      if (leg.summary) {
        legNames.push(leg.summary.charAt(0).toUpperCase() + leg.summary.substring(1));
      }

      for (const step of leg.steps) {
        const geometry = this.decodePolyline(step.geometry);
        result.coordinates.push(...geometry);

        const legIndex = leg.steps.indexOf(step);
        const type = this.maneuverToInstructionType(step.maneuver, legIndex === legCount - 1);
        const modifier = this.maneuverToModifier(step.maneuver);
        let text = '';

        if (stepToText) {
          text = stepToText(language, step, { legCount, legIndex });
        }

        if (type) {
          if ((legIndex == 0 && step.maneuver.type == 'depart') || step.maneuver.type == 'arrive') {
            waypointIndices.push(index);
          }

          result.instructions.push({
            type,
            distance: step.distance,
            time: step.duration,
            road: step.name,
            direction: this.bearingToDirection(step.maneuver.bearing_after),
            exit: step.maneuver.exit,
            index,
            mode: step.mode,
            modifier,
            text
          });
        }

        index += geometry.length;
      }
    }

    result.name = legNames.join(', ');
    if (!hasSteps) {
      result.coordinates = this.decodePolyline(responseRoute.geometry);
    } else {
      result.waypointIndices = waypointIndices;
    }

    return result;
  }

  private bearingToDirection(bearing: number) {
    const oct = Math.round(bearing / 45) % 8;
    return [Direction.N, Direction.NE, Direction.E, Direction.SE, Direction.S, Direction.SW, Direction.W, Direction.NW][oct];
  }

  private maneuverToInstructionType(maneuver: OSRMManeuver, lastLeg: boolean) {
    switch (maneuver.type) {
      case 'new name':
        return InstructionType.Continue;
      case 'depart':
        return InstructionType.Head;
      case 'arrive':
        return lastLeg ? InstructionType.DestinationReached : InstructionType.WaypointReached;
      case 'roundabout':
      case 'rotary':
        return InstructionType.Roundabout;
      case 'merge':
      case 'fork':
      case 'on ramp':
      case 'off ramp':
      case 'end of road':
        return this.camelCase(maneuver.type) as InstructionType;
        // These are all reduced to the same instruction in the current model
        //case 'turn':
        //case 'ramp': // deprecated in v5.1
      default:
        return this.camelCase(maneuver.modifier) as InstructionType;
    }
  }

  private maneuverToModifier(maneuver: OSRMManeuver): InstructionType {
    let modifier = maneuver.modifier;

    switch (maneuver.type) {
      case 'merge':
      case 'fork':
      case 'on ramp':
      case 'off ramp':
      case 'end of road':
        modifier = this.leftOrRight(modifier);
    }

    return modifier && this.camelCase(modifier) as InstructionType;
  }

  private camelCase(s: string) {
    const words = s.split(' ');
    let result = '';
    for (const word of words) {
      result += `${word.charAt(0).toUpperCase()}${word.substring(1)}`;
    }

    return result;
  }

  private leftOrRight(d: string) {
    return d.indexOf('left') >= 0 ? InstructionType.Left : InstructionType.Right;
  }

  private decodePolyline(routeGeometry: string) {
    const line = decode(routeGeometry, this.options.polylinePrecision) as [number, number][];
    return line.map((l) => L.latLng(l));
  }

  private toWaypoints(inputWaypoints: Waypoint[], vias: OSRMWaypoint[]) {
    return vias.map((via, i) => {
      const [lng, lat] = via.location;
      const { name, options } = inputWaypoints[i];

      return new Waypoint(L.latLng(lat, lng), name, options);
    });
  }

  /**
   * Returns the URL to calculate the route between the given waypoints; typically used for downloading the route in some other file format
   */
  buildRouteUrl(waypoints: Waypoint[], options?: RoutingOptions) {
    const locations: string[] = [];
    const hints: string[] = [];

    for (const waypoint of waypoints.filter((waypoint) => waypoint.latLng)) {
      const locationKey = this.locationKey(waypoint.latLng!);
      locations.push(locationKey);
      hints.push(this.hints.locations[locationKey] || '');
    }

    const { serviceUrl, profile, useHints } = this.options;
    const { simplifyGeometry = false, geometryOnly = false, allowUTurns = false } = options ?? {};

    const overviewParam = (geometryOnly ? (simplifyGeometry ? '' : 'overview=full') : 'overview=false');
    const useHintsParam = (useHints ? `&hints=${hints.join(';')}` : '');
    const allowUTurnsParam = (allowUTurns ? `&continue_straight=${!allowUTurns}` : '');
    return `${serviceUrl}/${profile}/${locations.join(';')}?${overviewParam}&alternatives=true&steps=true${useHintsParam}${allowUTurnsParam}`;
  }

  private locationKey({ lat, lng }: L.LatLng) {
    return `${lng},${lat}`;
  }

  private saveHintData(actualWaypoints: OSRMWaypoint[], waypoints: Waypoint[]) {
    this.hints = {
      locations: {}
    };

    const validWaypoints = waypoints.filter((waypoint) => waypoint.latLng);
    for (let i = actualWaypoints.length - 1; i >= 0; i--) {
      const { latLng } = validWaypoints[i];
      this.hints.locations[this.locationKey(latLng!)] = actualWaypoints[i].hint;
    }
  }
}

/**
 * Instantiates a new router with the provided options
 */
export function osrmv1(options?: OSRMv1Options) {
  return new OSRMv1(options);
}