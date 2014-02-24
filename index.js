var map = L.map('map'),
    sidebar = L.control.sidebar('sidebar', { position: 'left' }).addTo(map);


L.tileLayer('https://a.tiles.mapbox.com/v3/liedman.h9ekn0f1/{z}/{x}/{y}.png', {
	attribution: 'Maps by <a href="https://www.mapbox.com/about/maps/">MapBox</a>. ' +
		'Routes from <a href="http://project-osrm.org/">OSRM</a>, ' +
		'data uses <a href="http://opendatacommons.org/licenses/odbl/">ODbL</a> license'
}).addTo(map);

setTimeout(function () {
    sidebar.show();
}, 500);

L.Routing.control({
    waypoints: [
        L.latLng(48.8588,2.3469),
        L.latLng(52.3546,4.9039)
    ],
    geocoder: L.Control.Geocoder.nominatim(),
    plan: L.Routing.plan(null, {
        waypointIcon: function(i) {
            return new L.Icon.Label.Default({ labelText: String.fromCharCode(65 + i) });
        }
    })
}).addTo(map);
