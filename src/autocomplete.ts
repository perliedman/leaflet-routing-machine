import L from 'leaflet';
import { GeocodingResult, GeocodingCallback } from 'leaflet-control-geocoder/dist/geocoders/api';

type GeocoderQuery = (query: string, callback: GeocodingCallback) => void;

/**
 * Provides autocompletion for search entered into the geocoder. Uses [leaflet-control-geocoder](https://github.com/perliedman/leaflet-control-geocoder) by default
 */
export interface AutocompleteOptions {
  /**
   * Timeout in milliseconds before cancelling a running request
   * @default 500
   */
  timeout?: number;
  /**
   * Message to display when no results are found
   * @default 'No results found.'
   */
  noResultsMessage?: string;
  /**
   * Should the first suggestion be automatically selected?
   */
  autoSelectFirstResult?: boolean;
  /**
   * Function that handles formatting a geocode result to a string
   */
  formatGeocoderResult?: (result: GeocodingResult) => string;
  /**
   * Equivalent to leaflet-control-geocoder.geocode
   */
  resultFn?: GeocoderQuery;
  /**
   * Equivalent to leaflet-control-geocoder.suggest
   */
  autocompleteFn?: GeocoderQuery;
}

export default class Autocomplete {
  private readonly defaultOptions = {
    timeout: 500,
    noResultsMessage: 'No results found.',
    autoSelectFirstResult: true,
  };

  options: AutocompleteOptions = this.defaultOptions;

  private readonly element: HTMLInputElement;
  private readonly container: HTMLDivElement;
  private readonly resultTable: HTMLTableElement;
  private readonly resultFn?: GeocoderQuery;
  private readonly autocomplete?: GeocoderQuery;
  private readonly selectFn: (result: GeocodingResult) => void | Promise<void>;
  private isOpen = false;
  private results: GeocodingResult[] = [];
  private timer: number | undefined;
  private lastCompletedText = '';
  private selection?: Element | null = null;

  constructor(element: HTMLInputElement, callback: (result: GeocodingResult) => void | Promise<void>, options?: AutocompleteOptions) {
    this.options = {
      ...this.defaultOptions,
      ...options,
    }

    this.element = element;
    this.resultFn = options?.resultFn;
    this.autocomplete = options?.autocompleteFn;
    this.selectFn = callback;
    this.container = L.DomUtil.create('div', 'leaflet-routing-geocoder-result');
    this.resultTable = L.DomUtil.create('table', '', this.container);

    // TODO: looks a bit like a kludge to register same for input and keypress -
    // browsers supporting both will get duplicate events; just registering
    // input will not catch enter, though.
    // TODO: Try using keyup instead after typescript transition is over
    L.DomEvent.addListener(this.element, 'input', this.keyPressed, this);
    L.DomEvent.addListener(this.element, 'keypress', this.keyPressed, this);
    L.DomEvent.addListener(this.element, 'keydown', this.keyDown, this);
    L.DomEvent.addListener(this.element, 'blur', () => {
      if (this.isOpen) {
        this.close();
      }
    }, this);
  }

  close() {
    L.DomUtil.removeClass(this.container, 'leaflet-routing-geocoder-result-open');
    this.isOpen = false;
  }

  open() {
    const rect = this.element.getBoundingClientRect();
    if (!this.container.parentElement) {
      this.container.style.left = `${(rect.left + window.scrollX)}px`;
      this.container.style.top = `${(rect.bottom + window.scrollY)}px`;
      this.container.style.width = `${(rect.right - rect.left)}px`;
      document.body.appendChild(this.container);
    }

    L.DomUtil.addClass(this.container, 'leaflet-routing-geocoder-result-open');
    this.isOpen = true;
  }

  setResults(results: GeocodingResult[]) {
    delete this.selection;
    this.results = results;

    while (this.resultTable.firstChild) {
      this.resultTable.removeChild(this.resultTable.firstChild);
    }

    for (const result of results) {
      const tr = L.DomUtil.create('tr', '', this.resultTable);
      tr.setAttribute('data-result-index', results.indexOf(result).toString());
      const td = L.DomUtil.create('td', '', tr);

      let text = result.name;
      if (this.options.formatGeocoderResult) {
        text = this.options.formatGeocoderResult(result);
      }

      td.append(text);
      // mousedown + click because:
      // http://stackoverflow.com/questions/10652852/jquery-fire-click-before-blur-event
      L.DomEvent.addListener(td, 'mousedown', L.DomEvent.preventDefault, this);
      L.DomEvent.addListener(td, 'click', () => this.createClickListener(result), this);
    }

    if (!results.length) {
      const tr = L.DomUtil.create('tr', 'leaflet-routing-geocoder-no-results-row', this.resultTable);
      const td = L.DomUtil.create('td', 'leaflet-routing-geocoder-no-results', tr);
      td.innerHTML = this.options.noResultsMessage ?? this.defaultOptions.noResultsMessage;
    }

    this.open();
    if (results.length > 0 && this.options.autoSelectFirstResult) {
      // Select the first entry
      this.select(1);
    }
  }

  createClickListener(route: GeocodingResult) {
    this.element.blur();
    this.resultSelected(route);
  }

  resultSelected(route: GeocodingResult) {
    this.close();
    this.element.value = route.name;
    this.lastCompletedText = route.name;
    this.selectFn(route);
  }

  keyPressed(e: Event) {
    const { keyCode } = e as KeyboardEvent
    if (this.isOpen && keyCode === 13 && this.selection) {
      const index = parseInt(this.selection.getAttribute('data-result-index') ?? '0', 10);
      this.resultSelected(this.results[index]);
      L.DomEvent.preventDefault(e);
      return;
    }

    if (keyCode === 13) {
      if (this.timer) {
        clearTimeout(this.timer);
      }

      L.DomEvent.preventDefault(e);
      this.complete((query, callback) => this.resultFn?.(query, callback), true);
      return;
    }

    if (this.autocomplete && document.activeElement === this.element) {
      if (this.timer) {
        clearTimeout(this.timer);
      }

      this.timer = window.setTimeout(() => this.complete(this.autocomplete),
        this.options.timeout);
      return;
    }

    this.unselect();
  }

  select(dir: number) {
    let selection = this.selection;
    if (selection) {
      L.DomUtil.removeClass(selection as HTMLElement, 'leaflet-routing-geocoder-selected');
      selection = selection[dir > 0 ? 'nextElementSibling' : 'previousElementSibling'];
    }
    if (!selection) {
      selection = this.resultTable[dir > 0 ? 'firstElementChild' : 'lastElementChild'];
    }

    if (selection) {
      L.DomUtil.addClass(selection as HTMLElement, 'leaflet-routing-geocoder-selected');
      this.selection = selection;
    }
  }

  unselect() {
    if (this.selection) {
      L.DomUtil.removeClass(this.selection as HTMLElement, 'leaflet-routing-geocoder-selected');
    }

    delete this.selection;
  }

  keyDown(e: Event) {
    const { keyCode } = e as KeyboardEvent;
    if (this.isOpen) {
      switch (keyCode) {
      // Escape
        case 27:
          this.close();
          L.DomEvent.preventDefault(e);
          return;
          // Up
        case 38:
          this.select(-1);
          L.DomEvent.preventDefault(e);
          return;
          // Down
        case 40:
          this.select(1);
          L.DomEvent.preventDefault(e);
          return;
      }
    }
  }

  complete(completeFn?: GeocoderQuery, trySelect = false) {
    const { value } = this.element;

    if (!value || !completeFn) {
      return;
    }

    if (value !== this.lastCompletedText) {
      completeFn(value, () => this.completeResults());
    } else if (trySelect) {
      this.lastCompletedText = value;
      this.completeResults();
    }
  }

  completeResults() {
    if (this.results.length === 1) {
      this.resultSelected(this.results[0]);
    } else {
      this.setResults(this.results);
    }
  }
}

export function autocomplete(element: HTMLInputElement, callback: (result: GeocodingResult) => void | Promise<void>, options?: AutocompleteOptions) {
  return new Autocomplete(element, callback, options);
}