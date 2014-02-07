var map = L.map('map');

L.tileLayer('https://a.tiles.mapbox.com/v3/liedman.map-mmgw7jk5/{z}/{x}/{y}.png', {
	attribution: 'Maps by <a href="https://www.mapbox.com/about/maps/">MapBox</a>'
}).addTo(map);

L.Control.routing({
	vias: [
		L.latLng(57.74, 11.94),
		L.latLng(57.6792, 11.949)
	]
}).addTo(map);
