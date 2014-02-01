var router = new L.Routing.OSRM(),
    map = L.map('map');

L.tileLayer('https://a.tiles.mapbox.com/v3/liedman.map-mmgw7jk5/{z}/{x}/{y}.png', {
  attribution: 'Maps by <a href="https://www.mapbox.com/about/maps/">MapBox</a>'
}).addTo(map);

router.on('routeFound', function(routes) {
    var e = L.DomUtil.get('results'),
        route = routes[0],
        polyline = L.polyline(route.geometry, {color: 'red'});

    polyline.addTo(map);
    map.fitBounds(polyline.getBounds());

    e.innerHTML = JSON.stringify({summary: route.summary, geometry: route.geometry, instructions: route.instructions});
  });

router.route([
    L.latLng(57.74, 11.94),
    L.latLng(57.6792, 11.949)
  ]);
