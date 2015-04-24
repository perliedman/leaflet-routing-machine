var map1 = L.map('map-1', { scrollWheelZoom: false });

L.tileLayer('https://a.tiles.mapbox.com/v3/liedman.jokgn3nn/{z}/{x}/{y}.png', {
    attribution: 'Maps by <a href="https://www.mapbox.com/about/maps/">MapBox</a>. ' +
        'Routes from <a href="http://project-osrm.org/">OSRM</a>, ' +
        'data uses <a href="http://opendatacommons.org/licenses/odbl/">ODbL</a> license'
  }).addTo(map1);

var TouchLine = L.Routing.Line.extend({
        initialize: function(route, options) {
            this._route = route;
            L.Routing.Line.prototype.initialize.call(this, route, options);
        },

        onAdd: function(map) {
            L.Routing.Line.prototype.onAdd.call(this, map);

            if (L.Browser.touch) {
                map.on('zoomend', this._bufferRoute, this);
                this._lineString = {
                    type: "Feature",
                    geometry: L.Routing.routeToLineString(this._route),
                    properties: {}
                };
                this._bufferRoute();
            }
        },

        onRemove: function(map) {
            L.Routing.Line.prototype.onRemove.call(this, map);
            if (L.Browser.touch) {
                map.off('zoomend', this._bufferRoute, this);
            }
        },

        _bufferRoute: function() {
            if (this._bufferLayer) {
                this.removeLayer(this._bufferLayer);
            }

            var bounds = this._map.getPixelBounds(),
                se = this._map.unproject(bounds.min),
                pixelOffset = bounds.min.add([10, 10]),
                offset = this._map.unproject(pixelOffset),
                dLat = se.lat - offset.lat,
                dLng = se.lng - offset.lng,
                buffer = Math.sqrt(dLat * dLat + dLng * dLng),
                bufferGeojson = turf.buffer(this._lineString, buffer);

            this._bufferLayer = L.geoJson(bufferGeojson, {
                    //style: { fillOpacity: 0 }
                })
                .on('mousedown', function() { console.log('touched'); }, this)
                .addTo(this);
        }
    }),
    touchLine = function(route, options) { return new TouchLine(route, options); };


var control = L.Routing.control({
    routeWhileDragging: true,
    waypoints: [
        L.latLng(57.74, 11.94),
        L.latLng(57.6792, 11.949)
      ],
    geocoder: L.Control.Geocoder.nominatim(),
    routeLine: touchLine
}).addTo(map1);
