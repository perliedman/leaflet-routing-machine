var map = L.map('map', { scrollWheelZoom: false }),
	waypoints = [
		L.latLng(48.8588,2.3469),
		L.latLng(52.3546,4.9039)
	];

L.tileLayer(LRM.tileLayerUrl, {
	attribution: 'Maps and routes from <a href="https://www.openstreetmap.org">OpenStreetMap</a>. ' +
		'data uses <a href="http://opendatacommons.org/licenses/odbl/">ODbL</a> license'
}).addTo(map);

var control = L.Routing.control({
		router: L.routing.osrmv1({
			serviceUrl: LRM.osmServiceUrl
		}),
		plan: L.Routing.plan(waypoints, {
			createMarker: function(i, wp) {
				return L.marker(wp.latLng, {
					draggable: true,
					icon: L.icon.glyph({ glyph: String.fromCharCode(65 + i) })
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
	.on('routingerror', function(e) {
		try {
			map.getCenter();
		} catch (e) {
			map.fitBounds(L.latLngBounds(waypoints));
		}

		handleError(e);
	});

L.Routing.errorControl(control).addTo(map);
