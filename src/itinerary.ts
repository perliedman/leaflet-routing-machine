import L from 'leaflet';
import Formatter, { FormatterOptions } from './formatter';
import ItineraryBuilder from './itinerary-builder';
import { IRoute, RouteEvent } from './common/types';

interface ISummary extends IRoute {
  name: string;
  distance: string;
  time: string;
}

export interface ItineraryOptions extends L.ControlOptions, FormatterOptions {
  pointMarkerStyle?: L.CircleMarkerOptions;
  summaryTemplate?: string | ((data: ISummary) => string);
  timeTemplate?: string;
  containerClassName?: string;
  alternativeClassName?: string;
  minimizedClassName?: string;
  itineraryClassName?: string;
  totalDistanceRoundingSensitivity?: number;
  show?: boolean;
  collapsible?: boolean;
  collapseBtn?: (itinerary: Itinerary) => void;
  collapseBtnClass?: string;
  formatter?: Formatter;
  itineraryBuilder?: ItineraryBuilder;
}

class ItineraryControl {
  constructor(...args: any[]) {
  }
}

interface ItineraryControl extends L.Control, L.Evented {
}
L.Util.extend(ItineraryControl.prototype, L.Control.prototype);
L.Util.extend(ItineraryControl.prototype, L.Evented.prototype);

export default class Itinerary extends ItineraryControl {
  private readonly defaultOptions = {
    pointMarkerStyle: {
      radius: 5,
      color: '#03f',
      fillColor: 'white',
      opacity: 1,
      fillOpacity: 0.7
    },
    summaryTemplate: '<h2>{name}</h2><h3>{distance}, {time}</h3>',
    timeTemplate: '{time}',
    containerClassName: '',
    alternativeClassName: '',
    minimizedClassName: '',
    itineraryClassName: '',
    totalDistanceRoundingSensitivity: -1,
    show: true,
    collapsible: undefined,
    collapseBtn: (itinerary: Itinerary) => {
      const collapseBtn = L.DomUtil.create('span', itinerary.options.collapseBtnClass);
      L.DomEvent.on(collapseBtn, 'click', itinerary.toggle, itinerary);
      itinerary.container?.insertBefore(collapseBtn, itinerary.container.firstChild);
    },
    collapseBtnClass: 'leaflet-routing-collapse-btn'
  };

  options: ItineraryOptions;

  private formatter: Formatter;
  private itineraryBuilder: ItineraryBuilder;
  private container?: HTMLDivElement;
  private altContainer?: HTMLDivElement;
  protected routes: IRoute[] = [];
  private altElements: HTMLElement[] = [];
  private marker?: L.CircleMarker;
  map?: L.Map;

  constructor(options?: ItineraryOptions) {
    super(options);

    this.options = {
      ...super.options,
      ...this.defaultOptions,
      ...options,
    };

    this.formatter = this.options.formatter || new Formatter(this.options);
    this.itineraryBuilder = this.options.itineraryBuilder || new ItineraryBuilder({
      containerClassName: this.options.itineraryClassName
    });
  }

  onAdd(map: L.Map) {
    let { collapsible, show, collapseBtn = this.defaultOptions.collapseBtn } = this.options;
    collapsible = collapsible || (collapsible === undefined && map.getSize().x <= 640);

    const conditionalClassNames = `${(!show ? 'leaflet-routing-container-hide ' : '')} ${(collapsible ? 'leaflet-routing-collapsible ' : '')}`;
    this.container = L.DomUtil.create('div', `leaflet-routing-container leaflet-bar ${conditionalClassNames} ${this.options.containerClassName}`);
    this.altContainer = this.createAlternativesContainer();
    this.container.appendChild(this.altContainer);
    L.DomEvent.disableClickPropagation(this.container);
    L.DomEvent.addListener(this.container, 'mousewheel', (e) => {
      L.DomEvent.stopPropagation(e);
    }, this);

    if (collapsible) {
      collapseBtn(this);
    }

    return this.container;
  }

  onRemove(map: L.Map) {
  }

  createAlternativesContainer() {
    return L.DomUtil.create('div', 'leaflet-routing-alternatives-container');
  }

  setAlternatives(routes: IRoute[]) {
    this.clearAlts();

    this.routes = routes;

    for (const alt of this.routes) {
      const altDiv = this.createAlternative(alt, this.routes.indexOf(alt));
      this.altContainer?.appendChild(altDiv);
      this.altElements.push(altDiv);
    }

    this.selectRoute({ route: this.routes[0], alternatives: this.routes.slice(1) });

    return this;
  }

  show() {
    if (this.container) {
      L.DomUtil.removeClass(this.container, 'leaflet-routing-container-hide');
    }
  }

  hide() {
    if (this.container) {
      L.DomUtil.addClass(this.container, 'leaflet-routing-container-hide');
    }
  }

  private toggle() {
    if (this.container) {
      const collapsed = L.DomUtil.hasClass(this.container, 'leaflet-routing-container-hide');
      collapsed ? this.show() : this.hide();
    }
  }

  private createAlternative(alt: IRoute, index: number) {
    const {
      minimizedClassName,
      alternativeClassName,
      summaryTemplate = this.defaultOptions.summaryTemplate,
      totalDistanceRoundingSensitivity
    } = this.options;
    const className = index > 0 ? `leaflet-routing-alt-minimized ${minimizedClassName}` : '';
    const altDiv = L.DomUtil.create('div', `leaflet-routing-alt ${alternativeClassName} ${className}`);
    const template = summaryTemplate;
    const data = {
      ...{
        name: alt.name,
        distance: this.formatter.formatDistance(alt.summary.totalDistance, totalDistanceRoundingSensitivity),
        time: this.formatter.formatTime(alt.summary.totalTime)
      },
      ...alt
    };
    altDiv.innerHTML = typeof (template) === 'function' ? template(data) : L.Util.template(template, data);
    L.DomEvent.addListener(altDiv, 'click', this.onAltClicked, this);
    this.on('routeselected', this.selectAlt, this);

    altDiv.appendChild(this.createItineraryContainer(alt));
    return altDiv;
  }

  protected clearAlts() {
    const el = this.altContainer;
    while (el && el.firstChild) {
      el.removeChild(el.firstChild);
    }

    this.altElements = [];
  }

  private createItineraryContainer(route: IRoute) {
    const container = this.itineraryBuilder.createContainer();
    const steps = this.itineraryBuilder.createStepsContainer();

    container.appendChild(steps);

    for (const instruction of route.instructions) {
      const currentIndex = route.instructions.indexOf(instruction);
      const text = this.formatter.formatInstruction(instruction, currentIndex);
      const distance = this.formatter.formatDistance(instruction.distance);
      const icon = this.formatter.getIconName(instruction, currentIndex);
      const step = this.itineraryBuilder.createStep(text, distance, icon, steps);

      if (instruction.index) {
        this.addRowListeners(step, route.coordinates[instruction.index]);
      }
    }

    return container;
  }

  private addRowListeners(row: HTMLTableRowElement, coordinate: L.LatLng) {
    L.DomEvent.addListener(row, 'mouseover', () => {
      if (this.map) {
        this.marker = L.circleMarker(coordinate,
          this.options.pointMarkerStyle).addTo(this.map);
      }
    }, this);
    L.DomEvent.addListener(row, 'mouseout', () => {
      if (this.marker) {
        this.map?.removeLayer(this.marker);
        delete this.marker;
      }
    }, this);
    L.DomEvent.addListener(row, 'click', (e) => {
      this.map?.panTo(coordinate);
      L.DomEvent.stopPropagation(e);
    }, this);
  }

  private onAltClicked(e: MouseEvent) {
    let altElem = e.target as HTMLElement;
    while (!L.DomUtil.hasClass(altElem, 'leaflet-routing-alt')) {
      altElem = altElem.parentElement;
    }

    const alts = this.routes.slice();
    const route = alts.splice(this.altElements.indexOf(altElem), 1)[0];

    this.fire('routeselected', {
      route: route,
      alternatives: alts
    });
  }

  private selectAlt(e: RouteEvent) {
    const altElem = this.altElements[e.route.routesIndex];
    if (L.DomUtil.hasClass(altElem, 'leaflet-routing-alt-minimized')) {
      for (const altElement of this.altElements) {
        const currentIndex = this.altElements.indexOf(altElement);
        const classFn = currentIndex === e.route.routesIndex ? 'removeClass' : 'addClass';
        L.DomUtil[classFn](altElement, 'leaflet-routing-alt-minimized');
        if (this.options.minimizedClassName) {
          L.DomUtil[classFn](altElement, this.options.minimizedClassName);
        }

        if (currentIndex !== e.route.routesIndex) {
          altElement.scrollTop = 0;
        }
      }
    }

    L.DomEvent.stop(e);
  }

  private selectRoute(routes: RouteEvent) {
    if (this.marker) {
      this.map?.removeLayer(this.marker);
      delete this.marker;
    }
    this.fire('routeselected', routes);
  }
}
