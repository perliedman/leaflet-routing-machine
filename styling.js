var map = L.map('map'),
    sidebar = L.control.sidebar('sidebar', { position: 'left' }).addTo(map);


L.tileLayer('https://a.tiles.mapbox.com/v3/liedman.jokgn3nn/{z}/{x}/{y}.png', {
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
    lineOptions: {
            styles: [
                // Shadow
                {color: 'black', opacity: 0.8, weight: 11},
                // Outline
                {color: 'green', opacity: 0.8, weight: 8},
                // Center
                {color: 'orange', opacity: 1, weight: 4}
            ],
    }
}).addTo(map);
