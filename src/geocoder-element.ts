import L from 'leaflet';
import { IGeocoder, GeocodingResult } from 'leaflet-control-geocoder/dist/geocoders/api';
import Autocomplete, { AutocompleteOptions } from './autocomplete';
import Locale from './locales/types';
import Localization from './localization';
import Waypoint from './waypoint';

interface GeocoderElementCollection {
  container: HTMLElement;
  input: HTMLInputElement;
  closeButton?: HTMLElement;
}

export interface GeocoderElementsOptions extends L.ControlOptions {
  autocompleteOptions?: AutocompleteOptions,
  createGeocoder?: (waypointIndex: number, numberOfWaypoints: number, options: GeocoderElementsOptions) => GeocoderElementCollection;
  geocoderPlaceholder?: (waypointIndex: number, numberOfWaypoints: number, geocoderElement: any) => string;
  geocoderClass?: (waypointIndex?: number, numberOfWaypoints?: number) => string;
  locale?: Locale,
  maxGeocoderTolerance?: number,
  waypointNameFallback?: (latLng: L.LatLng) => string;
  formatGeocoderResult?: (result: GeocodingResult) => string;
  geocoder?: IGeocoder;
  addWaypoints?: boolean;
}

class EventedControl {
  constructor(...args: any[]) {
  }
}

interface EventedControl extends L.Control, L.Evented { }
L.Util.extend(EventedControl.prototype, L.Control.prototype);
L.Util.extend(EventedControl.prototype, L.Evented.prototype);

export default class GeocoderElement extends EventedControl {
  private readonly defaultOptions = {
    createGeocoder: (_: number, numberOfWaypoints: number, options: GeocoderElementsOptions) => {
      const container = L.DomUtil.create('div', 'leaflet-routing-geocoder');
      const input = L.DomUtil.create('input', '', container);
      const remove = options.addWaypoints ? L.DomUtil.create('span', 'leaflet-routing-remove-waypoint', container) : undefined;

      input.disabled = !options.addWaypoints;

      return {
        container: container,
        input: input,
        closeButton: remove
      };
    },

    geocoderPlaceholder: (waypointIndex: number, numberWaypoints: number, geocoderElement: GeocoderElement) => {
      const l = new Localization(geocoderElement.options.locale).localize('ui');

      if (waypointIndex === 0) {
        return l.startPlaceholder;
      }

      if (waypointIndex < numberWaypoints - 1) {
        return L.Util.template(l.viaPlaceholder, { viaNumber: waypointIndex });
      }

      return l.endPlaceholder;
    },

    geocoderClass: () => {
      return '';
    },

    waypointNameFallback: (latLng: L.LatLng) => {
      const ns = latLng.lat < 0 ? 'S' : 'N';
      const ew = latLng.lng < 0 ? 'W' : 'E';
      const lat = (Math.round(Math.abs(latLng.lat) * 10000) / 10000).toString();
      const lng = (Math.round(Math.abs(latLng.lng) * 10000) / 10000).toString();

      return ns + lat + ', ' + ew + lng;
    },
    maxGeocoderTolerance: 200,
    autocompleteOptions: {},
    language: 'en',
  };

  options: GeocoderElementsOptions;

  private element: GeocoderElementCollection;
  private waypoint: Waypoint;

  constructor(waypoint: Waypoint, waypointIndex: number, numberOfWaypoints: number, options: GeocoderElementsOptions) {
    super();

    this.options = {
      ...this.defaultOptions,
      ...options,
    }

    const {
      createGeocoder = this.defaultOptions.createGeocoder,
      geocoderPlaceholder = this.defaultOptions.geocoderPlaceholder,
      geocoderClass = this.defaultOptions.geocoderClass,
    } = this.options;

    const geocoder = createGeocoder(waypointIndex, numberOfWaypoints, this.options);
    const closeButton = geocoder.closeButton;
    const geocoderInput = geocoder.input;
    geocoderInput.setAttribute('placeholder', geocoderPlaceholder(waypointIndex, numberOfWaypoints, this));
    geocoderInput.className = geocoderClass(waypointIndex, numberOfWaypoints);

    this.element = geocoder;
    this.waypoint = waypoint;

    this.update();
    // This has to be here, or geocoder's value will not be properly
    // initialized.
    // TODO: look into why and make _updateWaypointName fix this.
    geocoderInput.value = waypoint.name ?? '';

    L.DomEvent.addListener(geocoderInput, 'click', (e) => {
      this.selectInputText(e.currentTarget as HTMLInputElement);
    }, this);

    if (closeButton) {
      L.DomEvent.addListener(closeButton, 'click', () => {
        this.fire('delete', { waypoint: this.waypoint });
      }, this);
    }

    if (typeof this.options.formatGeocoderResult == 'function') {
      if (!this.options.autocompleteOptions) {
        this.options.autocompleteOptions = {};
      }

      this.options.autocompleteOptions.formatGeocoderResult = this.options.formatGeocoderResult;
    }

    new Autocomplete(geocoderInput, (r) => {
      geocoderInput.value = r.name;
      this.waypoint.name = r.name;
      this.waypoint.latLng = r.center;
      this.fire('geocoded', { waypoint: this.waypoint, value: r });
    }, {
      ...{
        resultFn: this.options.geocoder?.geocode,
        autocompleteFn: this.options.geocoder?.suggest,
      },
      ...this.options.autocompleteOptions
    });
  }

  getContainer() {
    return this.element.container;
  }

  setValue(value: string) {
    this.element.input.value = value;
  }

  update(force = false) {
    const { name, latLng } = this.waypoint;

    if (latLng && (force || !name)) {
      const {
        waypointNameFallback = this.defaultOptions.waypointNameFallback,
        maxGeocoderTolerance = this.defaultOptions.maxGeocoderTolerance,
      } = this.options;
      const waypointCoordinates = waypointNameFallback(latLng);
      if (this.options.geocoder?.reverse) {
        this.options.geocoder.reverse(latLng, 67108864 /* zoom 18 */, (result) => {
          if (result.length > 0 && result[0].center.distanceTo(latLng) < maxGeocoderTolerance) {
            this.waypoint.name = result[0].name;
          } else {
            this.waypoint.name = waypointCoordinates;
          }
          this.setReverseGeocodeResult();
        });
      } else {
        this.waypoint.name = waypointCoordinates;
        this.setReverseGeocodeResult();
      }
    }
  }

  focus() {
    const { input } = this.element;
    input.focus();
    this.selectInputText(input);
  }

  private setReverseGeocodeResult() {
    const value = this.waypoint?.name ?? '';
    this.setValue(value);
    this.fire('reversegeocoded', { waypoint: this.waypoint, value });
  }

  private selectInputText(input: HTMLInputElement) {
    if (input.setSelectionRange) {
      // On iOS, select() doesn't work
      input.setSelectionRange(0, 9999);
    } else {
      // On at least IE8, setSeleectionRange doesn't exist
      input.select();
    }
  }
}
