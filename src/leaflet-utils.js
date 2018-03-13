import L from 'leaflet'

export function toLatLng (lngLat) {
  return L.latLng(lngLat[1], lngLat[0])
}

export function toLngLat (latLng) {
  return [latLng.lng, latLng.lat]
}
