var map1 = L.map('map-1', { scrollWheelZoom: false });

L.tileLayer(LRM.tileLayerUrl, {
    attribution: 'Maps and routes from <a href="https://www.openstreetmap.org">OpenStreetMap</a>. ' +
        'data uses <a href="http://opendatacommons.org/licenses/odbl/">ODbL</a> license'
}).addTo(map1);

var control1 = L.Routing.control({
        router: L.routing.osrmv1({
			serviceUrl: 'https://routing.openstreetmap.de/routed-car/route/v1'
		}),
        waypoints: [
            L.latLng(57.74, 11.94),
            L.latLng(57.6792, 11.949)
        ],
        routeWhileDragging: true,
        geocoder: L.Control.Geocoder.nominatim()
    })
    .on('routingerror', function(e) {
        try {
            map1.getCenter();
        } catch (e) {
            map1.fitBounds(L.latLngBounds(control1.getWaypoints().map(function(wp) { return wp.latLng; })));
        }

        handleError(e);
    })
    .addTo(map1);

var map2 = L.map('map-2', { scrollWheelZoom: false });

L.tileLayer(LRM.tileLayerUrl, {
    attribution: 'Maps and routes from <a href="https://www.openstreetmap.org">OpenStreetMap</a>. ' +
        'Geocoding by <a href="https://openrouteservice.org">OpenRouteService</a>' +
        'data uses <a href="http://opendatacommons.org/licenses/odbl/">ODbL</a> license'
}).addTo(map2);

var control2 = L.Routing.control({
        router: L.routing.osrmv1({
			serviceUrl: LRM.osmServiceUrl
		}),
        waypoints: [
            L.latLng(37.76, -122.45),
            L.latLng(38.12, -122.22)
        ],
        routeWhileDragging: true,
        geocoder: L.Control.Geocoder.openrouteservice({
            serviceUrl: LRM.orsServiceUrl,
            apiKey: LRM.apiToken
        }),
        waypointNameFallback: function(latLng) {
            function zeroPad(n) {
                n = Math.round(n);
                return n < 10 ? '0' + n : n;
            }
            function hexagecimal(p, pos, neg) {
                var n = Math.abs(p),
                    degs = Math.floor(n),
                    mins = (n - degs) * 60,
                    secs = (mins - Math.floor(mins)) * 60,
                    frac = Math.round((secs - Math.floor(secs)) * 100);
                return (n >= 0 ? pos : neg) + degs + '°' + zeroPad(mins) + '\'' + zeroPad(secs) + '.' + zeroPad(frac) + '"';
            }

            return hexagecimal(latLng.lat, 'N', 'S') + ' ' + hexagecimal(latLng.lng, 'E', 'W');
        }
    })
    .on('routingerror', function(e) {
        try {
            map2.getCenter();
        } catch (e) {
            map2.fitBounds(L.latLngBounds(control2.getWaypoints().map(function(wp) { return wp.latLng; })));
        }

        handleError(e);
    })
    .addTo(map2);

L.Routing.errorControl(control1).addTo(map1);
L.Routing.errorControl(control2).addTo(map2);
