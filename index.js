var router = L.Routing.osrm(),
    map = L.map('map'),
    vias = [
        L.latLng(57.74, 11.94),
        L.latLng(57.6792, 11.949)
    ],
    line;

L.tileLayer('https://a.tiles.mapbox.com/v3/liedman.map-mmgw7jk5/{z}/{x}/{y}.png', {
    attribution: 'Maps by <a href="https://www.mapbox.com/about/maps/">MapBox</a>. ' +
        'Routes from <a href="http://project-osrm.org/">OSRM</a>, ' +
        'data uses <a href="http://opendatacommons.org/licenses/odbl/">ODbL</a> license'
}).addTo(map);

function hookEvents(l) {
    var t;

    l.on('viadrag', function(e) {
        vias[e.index] = e.latlng;
        if (t) {
            clearTimeout(t);
        }
        t = setTimeout(function() {
            router.route(vias);
        }, 1000);
    });

    l.on('viaadded', function(e) {
        vias.splice(e.afterIndex + 1, 0, e.latlng);
        router.route(vias);
    });
}

router.on('routefound', function(e) {
    var route = e.routes[0];

    if (line) {
        map.removeLayer(line);
    }

    line = L.Routing.line(route);
    line.addTo(map);
    map.fitBounds(line.getBounds());

    hookEvents(line);
});

router.on('error', function(err) {
    var e = L.DomUtil.get('response');
    e.innerHTML = 'Error ' + err.status + ': ' + err.message;
});

map.addControl(L.Routing.itinerary(router));

router.route(vias);
