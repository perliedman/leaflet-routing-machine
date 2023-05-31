import L from 'leaflet';
import { LineTouchedEvent } from './common/types';
import GeocoderElement, { GeocoderElementsOptions } from './geocoder-element';
import Waypoint from './waypoint';

export interface PlanOptions extends GeocoderElementsOptions, L.LayerOptions {
  /**
   * Styles used for the line or lines drawn when dragging a waypoint
   * @default [{ color: 'black', opacity: 0.15, weight: 7 }, { color: 'white', opacity: 0.8, weight: 4 }, { color: 'orange', opacity: 1, weight: 2, dashArray: '7,12' }]
   */
  dragStyles?: L.PathOptions[];
  /**
   * Can waypoints be dragged in the map
   * @default true
   */
  draggableWaypoints?: boolean;
  /**
   * If true, the route is continously recalculated while waypoint markers are dragged
   * @default false
   */
  routeWhileDragging?: boolean;
  /**
   * Can new waypoints be added by the user
   * @default true
   */
  addWaypoints?: boolean;
  /**
   * If true, a button to reverse the order of the waypoints is enabled
   * @default false
   */
  reverseWaypoints?: boolean;
  /**
   * HTML classname to assign to the add waypoint button
   */
  addButtonClassName?: string;
  /**
   * HTML classname to assign to geocoders container
   * @default ''
   */
  geocodersClassName?: string;
  /**
   * Provides a function to create a custom geocoder element
   * @default {@link GeocoderElement}
   */
  createGeocoderElement?: (waypoint: Waypoint, waypointIndex: number, numberOfWaypoints: number, options: GeocoderElementsOptions) => GeocoderElement;
  /**
   * Creates a marker to use for a waypoint. If return value is falsy, no marker is added for the waypoint
   */
  createMarker?: (waypointIndex: number, waypoint: Waypoint, numberOfWaypoints?: number) => L.Marker;
  /**
   * determines whether waypoint names should be cleared after dragging
   * @default true
   */
  clearWaypointNameOnDragEnd?: boolean;
}

type LeafletHookedEvent = L.LeafletEvent | { latlng: L.LatLng };

/**
 * User interface to edit the plan for a route (an ordered list of waypoints).
 */
export default class Plan extends L.Layer {
  private readonly defaultOptions = {
    dragStyles: [
      { color: 'black', opacity: 0.15, weight: 9 },
      { color: 'white', opacity: 0.8, weight: 6 },
      { color: 'red', opacity: 1, weight: 2, dashArray: '7,12' }
    ],
    draggableWaypoints: true,
    routeWhileDragging: false,
    addWaypoints: true,
    reverseWaypoints: false,
    clearWaypointNameOnDragEnd: true,
    addButtonClassName: '',
    language: 'en',
    createGeocoderElement: (waypoint: Waypoint, waypointIndex: number, numberOfWaypoints: number, plan: GeocoderElementsOptions) => {
      return new GeocoderElement(waypoint, waypointIndex, numberOfWaypoints, plan);
    },
    createMarker: (waypointIndex: number, waypoint: Waypoint) => {
      const options = {
        draggable: this.options.draggableWaypoints
      };

      return L.marker(waypoint.latLng ?? [0, 0], options);
    },
    geocodersClassName: ''
  };

  options: PlanOptions;

  private waypoints: Waypoint[];
  private geocoderContainer?: HTMLDivElement;
  private geocoderElements: GeocoderElement[] = [];
  private markers: L.Marker[] = [];

  constructor(waypoints: (Waypoint | L.LatLng)[], options?: PlanOptions) {
    super();

    this.options = {
      ...this.defaultOptions,
      ...options,
    };

    this.waypoints = [];
    this.setWaypoints(waypoints.map((waypoint) => waypoint instanceof Waypoint ? waypoint : new Waypoint(waypoint)));
  }

  /**
   * Returns true if the plan is ready to be routed, meaning it has at least a start and end waypoint, and both have coordinates
   */
  isReady() {
    return this.waypoints.every((waypoint) => {
      const { latLng } = waypoint;
      return latLng && ((latLng.lat > 0 && latLng.lng > 0) || (latLng.lat === 0 && latLng.lng > 0) || (latLng.lng === 0 && latLng.lat > 0));
    });
  }

  /**
   * Returns the plan’s waypoints
   */
  getWaypoints() {
    return [...this.waypoints];
  }

  /**
   * Sets the plan’s waypoints
   */
  setWaypoints(waypoints: Waypoint[]) {
    this.spliceWaypoints(0, this.waypoints.length, ...waypoints);
    return this;
  }

  /**
   * Allows adding, removing or replacing the plan’s waypoints. Syntax is the same as in Array#splice
   */
  spliceWaypoints(startIndex: number, deleteCount = 0, ...newWaypoints: Waypoint[]) {
    this.waypoints.splice(startIndex, deleteCount, ...newWaypoints)

    // Make sure there's always at least two waypoints
    while (this.waypoints.length < 2) {
      this.spliceWaypoints(this.waypoints.length, 0);
    }

    this.updateMarkers();
    this.fireChanged(startIndex, deleteCount, ...newWaypoints);
  }

  onAdd(map: L.Map) {
    this._map = map;
    this.updateMarkers();

    return this;
  }

  onRemove() {
    this.removeMarkers();

    return this;
  }

  /**
   * Creates and returns an HTML widget with geocoder input fields for editing waypoints by address
   */
  createGeocoders() {
    const container = L.DomUtil.create('div', `leaflet-routing-geocoders ${this.options.geocodersClassName}`);

    this.geocoderContainer = container;
    this.geocoderElements = [];

    if (this.options.addWaypoints) {
      const addWaypointButton = L.DomUtil.create('button', `leaflet-routing-add-waypoint ${this.options.addButtonClassName}`, container);
      addWaypointButton.setAttribute('type', 'button');
      L.DomEvent.addListener(addWaypointButton, 'click', () => {
        this.spliceWaypoints(this.waypoints.length, 0, new Waypoint());
      }, this);
    }

    if (this.options.reverseWaypoints) {
      const reverseButton = L.DomUtil.create('button', 'leaflet-routing-reverse-waypoints', container);
      reverseButton.setAttribute('type', 'button');
      L.DomEvent.addListener(reverseButton, 'click', () => {
        this.waypoints.reverse();
        this.setWaypoints(this.waypoints);
      }, this);
    }

    this.updateGeocoders();
    this.on('waypointsspliced', this.updateGeocoders, this);

    return container;
  }

  createGeocoder(waypointIndex: number) {
    const { createGeocoderElement = this.defaultOptions.createGeocoderElement } = this.options;
    const geocoder = createGeocoderElement(this.waypoints[waypointIndex], waypointIndex, this.waypoints.length, this.options);
    geocoder.on('delete', () => {
      if (waypointIndex > 0 || this.waypoints.length > 2) {
        this.spliceWaypoints(waypointIndex, 1);
      } else {
        this.spliceWaypoints(waypointIndex, 1, new Waypoint([0, 0]));
      }
    }).on('geocoded', (e) => {
      this.updateMarkers();
      this.fireChanged();
      this.focusGeocoder(waypointIndex + 1);
      this.fire('waypointgeocoded', {
        waypointIndex,
        waypoint: e.waypoint
      });
    }).on('reversegeocoded', (e) => {
      this.fire('waypointgeocoded', {
        waypointIndex,
        waypoint: e.waypoint
      });
    });

    return geocoder;
  }

  updateGeocoders() {
    for (const geocoderElement of this.geocoderElements) {
      this.geocoderContainer?.removeChild(geocoderElement.getContainer());
    }

    const elements = [...this.waypoints].reverse().map((waypoint) => {
      const geocoderElement = this.createGeocoder(this.waypoints.indexOf(waypoint));
      this.geocoderContainer?.insertBefore(geocoderElement.getContainer(), this.geocoderContainer.firstChild);

      return geocoderElement;
    });

    this.geocoderElements = elements.reverse();
  }

  removeMarkers() {
    if (this.markers) {
      for (const marker of this.markers) {
        this._map.removeLayer(marker);
      }
    }

    this.markers = [];
  }

  updateMarkers() {
    if (!this._map) {
      return;
    }

    this.removeMarkers();

    const { createMarker = this.defaultOptions.createMarker } = this.options;
    for (const waypoint of this.waypoints) {
      if (waypoint.latLng) {
        const waypointIndex = this.waypoints.indexOf(waypoint);
        const marker = createMarker(waypointIndex, waypoint, this.waypoints.length);
        if (marker) {
          marker.addTo(this._map);
          if (this.options.draggableWaypoints) {
            this.hookWaypointEvents(marker, waypointIndex);
          }

          this.markers.push(marker);
        }
      }
    }
  }

  fireChanged(startIndex?: number, deleteCount?: number, ...newWaypoints: Waypoint[]) {
    this.fire('waypointschanged', { waypoints: this.getWaypoints() });

    if (startIndex) {
      this.fire('waypointsspliced', {
        index: startIndex,
        nRemoved: deleteCount,
        added: newWaypoints
      });
    }
  }

  hookWaypointEvents(marker: L.Marker, waypointIndex: number, trackMouseMove = false) {
    const eventLatLng = (e: LeafletHookedEvent) => {
      return trackMouseMove ? (e as L.LeafletMouseEvent).latlng : (e as L.LeafletEvent).target.getLatLng();
    };
    const dragStart = (e: LeafletHookedEvent) => {
      this.fire('waypointdragstart', { index: waypointIndex, latlng: eventLatLng(e) });
    };

    const drag = (e: LeafletHookedEvent) => {
      this.waypoints[waypointIndex].latLng = eventLatLng(e);
      this.fire('waypointdrag', { index: waypointIndex, latlng: eventLatLng(e) });
    };
    const dragEnd = (e: LeafletHookedEvent) => {
      this.waypoints[waypointIndex].latLng = eventLatLng(e);
      if (this.options.clearWaypointNameOnDragEnd) {
        this.waypoints[waypointIndex].name = '';
      }

      if (this.geocoderElements) {
        this.geocoderElements[waypointIndex].update(true);
      }
      this.fire('waypointdragend', { index: waypointIndex, latlng: eventLatLng(e) });
      this.fireChanged();
    };

    if (trackMouseMove) {
      const mouseMove = (e: L.LeafletMouseEvent) => {
        this.markers[waypointIndex].setLatLng(e.latlng);
        drag(e);
      };
      const mouseUp = (e: L.LeafletMouseEvent) => {
        this._map.dragging.enable();
        this._map.off('mouseup', mouseUp, this);
        this._map.off('mousemove', mouseMove, this);
        dragEnd(e);
      };
      this._map.dragging.disable();
      this._map.on('mousemove', mouseMove, this);
      this._map.on('mouseup', mouseUp, this);
      dragStart({ latlng: this.waypoints.filter((waypoint) => waypoint.latLng)[waypointIndex].latLng! });
    } else {
      marker.on('dragstart', dragStart, this);
      marker.on('drag', drag, this);
      marker.on('dragend', dragEnd, this);
    }
  }

  dragNewWaypoint(e: LineTouchedEvent) {
    const newWaypointIndex = e.afterIndex + 1;
    if (this.options.routeWhileDragging) {
      this.spliceWaypoints(newWaypointIndex, 0, new Waypoint(e.latlng));
      this.hookWaypointEvents(this.markers[newWaypointIndex], newWaypointIndex, true);
    } else {
      this._dragNewWaypoint(newWaypointIndex, e.latlng);
    }
  }

  private _dragNewWaypoint(newWaypointIndex: number, initialLatLng: L.LatLng) {
    const waypoint = new Waypoint(initialLatLng);
    const validWaypoints = this.waypoints.filter((waypoint) => waypoint.latLng);
    const previousWaypoint = validWaypoints[newWaypointIndex - 1];
    const nextWaypoint = validWaypoints[newWaypointIndex];
    const { createMarker = this.defaultOptions.createMarker } = this.options;
    const marker = createMarker(newWaypointIndex, waypoint, this.waypoints.length + 1);
    const lines: L.Polyline[] = [];
    const draggingEnabled = this._map.dragging.enabled();
    const mouseMove = (e: L.LeafletMouseEvent) => {
      if (marker) {
        marker.setLatLng(e.latlng);
      }
      for (const line of lines) {
        const latLngs = line.getLatLngs();
        latLngs.splice(1, 1, e.latlng);
        line.setLatLngs(latLngs);
      }

      L.DomEvent.stop(e);
    };
    const mouseUp = (e: L.LeafletMouseEvent) => {
      if (marker) {
        this._map.removeLayer(marker);
      }
      for (const line of lines) {
        this._map.removeLayer(line);
      }
      this._map.off('mousemove', mouseMove, this);
      this._map.off('mouseup', mouseUp, this);
      this.spliceWaypoints(newWaypointIndex, 0, new Waypoint(e.latlng));
      if (draggingEnabled) {
        this._map.dragging.enable();
      }

      L.DomEvent.stop(e);
    };

    if (marker) {
      marker.addTo(this._map);
    }

    const { dragStyles = this.defaultOptions.dragStyles } = this.options;
    for (const dragStyle of dragStyles) {
      lines.push(L.polyline([previousWaypoint.latLng!, initialLatLng, nextWaypoint.latLng!], dragStyle).addTo(this._map));
    }

    if (draggingEnabled) {
      this._map.dragging.disable();
    }

    this._map.on('mousemove', mouseMove, this);
    this._map.on('mouseup', mouseUp, this);
  }

  focusGeocoder(index: number) {
    if (this.geocoderElements[index]) {
      this.geocoderElements[index].focus();
    } else {
      (document.activeElement as HTMLElement).blur();
    }
  }
}

/**
 * Instantiates a new plan with given waypoint locations and options
 */
export function plan(waypoints: (Waypoint | L.LatLng)[], options?: PlanOptions) {
  return new Plan(waypoints, options);
}
