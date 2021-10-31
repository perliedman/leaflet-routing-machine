import L from 'leaflet';
import { RoutingErrorEvent } from './common/types';
import Control from './control';

interface Error {
  message: string;
  status: number;
}

interface ErrorControlOptions extends L.ControlOptions {
  header?: string;
  formatMessage?: (error: Error) => string;
}

export default class ErrorControl extends L.Control {
  private readonly defaultOptions = {
    header: 'Routing error',
    formatMessage: (error: Error) => {
      if (error.status < 0) {
        return `Calculating the route caused an error. Technical description follows: <code><pre>${error.message}</pre></code`;
      } else {
        return `The route could not be calculated. ${error.message}`;
      }
    }
  }

  options: ErrorControlOptions = this.defaultOptions;

  private element?: HTMLDivElement;

  constructor(routingControl: Control, options?: ErrorControlOptions) {
    super(options);

    this.options = {
      ...super.options,
      ...this.defaultOptions,
      ...options,
    };

    routingControl
      .on('routingerror', (e: RoutingErrorEvent) => {
        if (this.element) {
          const formatter = this.options.formatMessage ?? this.defaultOptions.formatMessage;
          this.element.children[1].innerHTML = formatter(e.error);
          this.element.style.visibility = 'visible';
        }
      })
      .on('routingstart', () => {
        if (this.element) {
          this.element.style.visibility = 'hidden';
        }
      });
  }

  onAdd() {
    this.element = L.DomUtil.create('div', 'leaflet-bar leaflet-routing-error');
    this.element.style.visibility = 'hidden';

    const header = L.DomUtil.create('h3', '', this.element);
    L.DomUtil.create('span', '', this.element);

    header.innerHTML = this.options.header ?? this.defaultOptions.header;

    return this.element;
  }

  onRemove() {
    delete this.element;
  }
}

export function errorControl(routingControl: Control, options?: ErrorControlOptions) {
  return new ErrorControl(routingControl, options);
}