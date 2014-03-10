var map = L.map('map').setView([57.5, 11.5], 9),
	sidebar = L.control.sidebar('sidebar', { position: 'left' }).addTo(map);


L.tileLayer('https://a.tiles.mapbox.com/v3/liedman.h9ekn0f1/{z}/{x}/{y}.png', {
	attribution: 'Maps by <a href="https://www.mapbox.com/about/maps/">MapBox</a>. ' +
		'Routes from <a href="http://project-osrm.org/">OSRM</a>, ' +
		'data uses <a href="http://opendatacommons.org/licenses/odbl/">ODbL</a> license'
}).addTo(map);

setTimeout(function () {
	sidebar.show();
}, 500);

var router = L.Routing.osrm(),
	waypoints = [],
	line;
router.on('routefound', function(e) {
	if (line) {
		map.removeLayer(line);
	}
	line = L.Routing.line(e.routes[0]).addTo(map);
});
map.on('click', function(e) {
	waypoints.push(e.latlng);
	if (waypoints.length >= 2) {
		router.route(waypoints);
	}
});
