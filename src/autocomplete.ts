import L from 'leaflet';
import { GeocodingResult, GeocodingCallback } from 'leaflet-control-geocoder/dist/geocoders/api';

type GeocoderQuery = (query: string, callback: GeocodingCallback) => void;

interface GeocoderOptions {
  resultFn?: GeocoderQuery;
  autocompleteFn?: GeocoderQuery;
}

export interface AutocompleteOptions extends GeocoderOptions {
  timeout?: number;
  blurTimeout?: number;
  noResultsMessage?: string;
  formatGeocoderResult?: (result: GeocodingResult) => string;
}

export default class Autocomplete {
  private readonly defaultOptions = {
    timeout: 500,
    blurTimeout: 100,
    noResultsMessage: 'No results found.'
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

  constructor(element: HTMLInputElement, callback: (result: GeocodingResult) => void | Promise<void>, options: AutocompleteOptions) {
    this.options = {
      ...this.defaultOptions,
      ...options,
    }

    this.element = element;
    this.resultFn = options.resultFn;
    this.autocomplete = options.autocompleteFn;
    this.selectFn = callback;
    this.container = L.DomUtil.create('div', 'leaflet-routing-geocoder-result');
    this.resultTable = L.DomUtil.create('table', '', this.container);

    // TODO: looks a bit like a kludge to register same for input and keypress -
    // browsers supporting both will get duplicate events; just registering
    // input will not catch enter, though.
    // TODO: Try using keyup instead after typescript transition is over
    L.DomEvent.addListener(this.element, 'input', this.keyPressed);
    L.DomEvent.addListener(this.element, 'keypress', this.keyPressed);
    L.DomEvent.addListener(this.element, 'keydown', this.keyDown);
    L.DomEvent.addListener(this.element, 'blur', () => {
      if (this.isOpen) {
        this.close();
      }
    });
  }

  close() {
    L.DomUtil.removeClass(this.container, 'leaflet-routing-geocoder-result-open');
    this.isOpen = false;
  }

  private open() {
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

  private setResults(results: GeocodingResult[]) {
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
      L.DomEvent.addListener(td, 'mousedown', L.DomEvent.preventDefault);
      L.DomEvent.addListener(td, 'click', () => this.createClickListener(result));
    }

    if (!results.length) {
      const tr = L.DomUtil.create('tr', '', this.resultTable);
      const td = L.DomUtil.create('td', 'leaflet-routing-geocoder-no-results', tr);
      td.innerHTML = this.options.noResultsMessage ?? this.defaultOptions.noResultsMessage;
    }

    this.open();
    if (results.length > 0) {
      // Select the first entry
      this.select(1);
    }
  }

  private createClickListener(route: GeocodingResult) {
    this.element.blur();
    this.resultSelected(route);
  }

  private resultSelected(route: GeocodingResult) {
    this.close();
    this.element.value = route.name;
    this.lastCompletedText = route.name;
    this.selectFn(route);
  }

  private keyPressed(e: Event) {
    const { keyCode } = e as KeyboardEvent
    if (this.isOpen && keyCode === 13 && this.selection) {
      const index = parseInt(this.selection.getAttribute('data-result-index') ?? '0', 10);
      this.resultSelected(this.results[index]);
      L.DomEvent.preventDefault(e);
      return;
    }

    if (keyCode === 13) {
      L.DomEvent.preventDefault(e);
      this.complete(this.resultFn, true);
      return;
    }

    if (this.autocomplete && document.activeElement === this.element) {
      if (this.timer) {
        clearTimeout(this.timer);
      }

      this.timer = setTimeout(() => this.complete(this.autocomplete),
        this.options.timeout);
      return;
    }

    this.unselect();
  }

  private select(dir: number) {
    let selection = this.selection;
    if (selection) {
      L.DomUtil.removeClass(selection.firstElementChild as HTMLElement, 'leaflet-routing-geocoder-selected');
      selection = selection[dir > 0 ? 'nextElementSibling' : 'previousElementSibling'];
    }
    if (!selection) {
      selection = this.resultTable[dir > 0 ? 'firstElementChild' : 'lastElementChild'];
    }

    if (selection) {
      L.DomUtil.addClass(selection.firstElementChild as HTMLElement, 'leaflet-routing-geocoder-selected');
      this.selection = selection;
    }
  }

  private unselect() {
    if (this.selection) {
      L.DomUtil.removeClass(this.selection.firstElementChild as HTMLElement, 'leaflet-routing-geocoder-selected');
    }
    delete this.selection;
  }

  private keyDown(e: Event) {
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

  private complete(completeFn?: GeocoderQuery, trySelect = false) {
    const { value } = this.element;

    if (!value || !completeFn) {
      return;
    }

    if (value !== this.lastCompletedText) {
      completeFn(value, this._completeResults);
    } else if (trySelect) {
      this.lastCompletedText = value;
      this._completeResults();
    }
  }

  private _completeResults() {
    if (this.results.length === 1) {
      this.resultSelected(this.results[0]);
    } else {
      this.setResults(this.results);
    }
  }
}
