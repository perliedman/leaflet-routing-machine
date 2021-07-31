var map = L.map('map-1', { scrollWheelZoom: false });

L.tileLayer(LRM.tileLayerUrl, {
    attribution: 'Maps and routes from <a href="https://www.openstreetmap.org">OpenStreetMap</a>. ' +
        'data uses <a href="http://opendatacommons.org/licenses/odbl/">ODbL</a> license'
}).addTo(map);

var control = L.Routing.control({
        router: L.routing.osrmv1({
			serviceUrl: LRM.osmServiceUrl
		}),
        waypoints: [
            L.latLng(57.74, 11.94),
            L.latLng(57.6792, 11.949)
        ],
        routeWhileDragging: true
    })
    .once('routesfound', function() {
        control.on('routesfound', function(e) {
            var routes = e.routes;
            alert('Found ' + routes.length + ' route(s).');
        });
    })
    .once('routeselected', function() {
        control.on('routeselected', function(e) {
            var route = e.route;
            alert('Showing route between waypoints:\n' + JSON.stringify(route.inputWaypoints, null, 2));
        })
    })
    .on('routingerror', function(e) {
        try {
            map.getCenter();
        } catch (e) {
            map.fitBounds(L.latLngBounds(control.getWaypoints().map(function(wp) { return wp.latLng; })));
        }

        handleError(e);
    })
    .addTo(map);

L.Routing.errorControl(control).addTo(map);
