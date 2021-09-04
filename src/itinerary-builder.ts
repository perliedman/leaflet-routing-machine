import L from 'leaflet';

interface ItineraryBuilderOptions {
  containerClassName?: string;
}

export default class ItineraryBuilder extends L.Class {
  private options: ItineraryBuilderOptions = {
    containerClassName: ''
  }

  constructor(options: ItineraryBuilderOptions) {
    super();

    this.options = {
      ...this.options,
      ...options,
    };
  }

  createContainer(className?: string) {
    const table = L.DomUtil.create('table', (className || '') + ' ' + this.options.containerClassName);
    const colgroup = L.DomUtil.create('colgroup', '', table);

    L.DomUtil.create('col', 'leaflet-routing-instruction-icon', colgroup);
    L.DomUtil.create('col', 'leaflet-routing-instruction-text', colgroup);
    L.DomUtil.create('col', 'leaflet-routing-instruction-distance', colgroup);

    return table;
  }

  createStepsContainer(container?: HTMLElement) {
    return L.DomUtil.create('tbody', '', container);
  }

  createStep(text: string, distance: string, icon?: string, steps?: HTMLElement) {
    const row = L.DomUtil.create('tr', '', steps);
    let td = L.DomUtil.create('td', '', row);
    const span = L.DomUtil.create('span', `leaflet-routing-icon leaflet-routing-icon-${icon}`, td);

    td.appendChild(span);
    td = L.DomUtil.create('td', '', row);
    td.appendChild(document.createTextNode(text));
    td = L.DomUtil.create('td', '', row);
    td.appendChild(document.createTextNode(distance));

    return row;
  }
}
