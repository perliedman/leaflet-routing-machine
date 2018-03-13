import L from 'leaflet'
import {Control, Waypoint, OSRMv1} from 'routing-components'
import Marker from './components/Marker.html'
import RouteLine from './components/RouteLine.html'

const defaultOptions = {
  Marker,
  RouteLine
}

export default {
  Control: L.Control.extend({
    initialize (options) {
      options = Object.assign({}, defaultOptions, options)
      options.waypoints = options.waypoints && options.waypoints.map(wp => {
        if (wp instanceof Waypoint) {
          return wp
        } else {
          const latLng = L.latLng(wp)
          return new Waypoint([latLng.lng, latLng.lat])
        }
      })

      options.router = options.router || new OSRMv1(options)

      L.setOptions(this, options)
    },

    onAdd (map) {
      this._container = L.DomUtil.create('div')
      L.DomEvent.disableClickPropagation(this._container)
      this._component = new Control({
        target: this._container,
        data: Object.assign({map}, this.options)
      })

      return this._container
    },

    onRemove (map) {
      this._component.destroy()
    }
  })
}
