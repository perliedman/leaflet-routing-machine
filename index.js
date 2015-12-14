var map = L.map('map', { scrollWheelZoom: false }),
	waypoints = [
		L.latLng(48.8588,2.3469),
		L.latLng(52.3546,4.9039)
	];

L.tileLayer('https://a.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=' + LRM.apiToken, {
	attribution: 'Maps by <a href="https://www.mapbox.com/about/maps/">MapBox</a>. ' +
		'Routes from <a href="http://project-osrm.org/">OSRM</a>, ' +
		'data uses <a href="http://opendatacommons.org/licenses/odbl/">ODbL</a> license'
}).addTo(map);

var control = L.Routing.control({
		plan: L.Routing.plan(waypoints, {
			createMarker: function(i, wp) {
				return L.marker(wp.latLng, {
					draggable: true,
					icon: new L.Icon.Label.Default({ labelText: String.fromCharCode(65 + i) })
				});
			},
			geocoder: L.Control.Geocoder.nominatim(),
			routeWhileDragging: true
		}),
		routeWhileDragging: true,
		routeDragTimeout: 250,
		showAlternatives: true,
		altLineOptions: {
			styles: [
				{color: 'black', opacity: 0.15, weight: 9},
				{color: 'white', opacity: 0.8, weight: 6},
				{color: 'blue', opacity: 0.5, weight: 2}
			]
		}
	})
	.addTo(map)
	.on('routingerror', function() {
		try {
			map.getCenter();
		} catch (e) {
			map.fitBounds(L.latLngBounds(waypoints));
		}
	});

L.Routing.errorControl(control).addTo(map);
