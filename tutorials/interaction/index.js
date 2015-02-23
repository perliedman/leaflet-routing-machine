var map1 = L.map('map-1', { scrollWheelZoom: false });

L.tileLayer('https://a.tiles.mapbox.com/v3/liedman.jokgn3nn/{z}/{x}/{y}.png', {
    attribution: 'Maps by <a href="https://www.mapbox.com/about/maps/">MapBox</a>. ' +
        'Routes from <a href="http://project-osrm.org/">OSRM</a>, ' +
        'data uses <a href="http://opendatacommons.org/licenses/odbl/">ODbL</a> license'
}).addTo(map1);

function button(label, container) {
    var btn = L.DomUtil.create('button', '', container);
    btn.setAttribute('type', 'button');
    btn.innerHTML = label;
    return btn;
}

var control = L.Routing.control({
    routeWhileDragging: true,
    plan: new (L.Routing.Plan.extend({
        createGeocoders: function() {
            var container = L.Routing.Plan.prototype.createGeocoders.call(this),
                reverseButton = button('&#8593;&#8595;', container);

            L.DomEvent.on(reverseButton, 'click', function() {
                var waypoints = this.getWaypoints();
                this.setWaypoints(waypoints.reverse());
            }, this);

            return container;
        }
    }))([
        L.latLng(57.74, 11.94),
        L.latLng(57.6792, 11.949)
    ], {
        geocoder: L.Control.Geocoder.nominatim(),
        routeWhileDragging: true
    })
}).addTo(map1);

map1.on('click', function(e) {
    var container = L.DomUtil.create('div'),
        startBtn = button('Start from this location', container),
        destBtn = button('Go to this location', container);

    L.DomEvent.on(startBtn, 'click', function() {
        control.spliceWaypoints(0, 1, e.latlng);
        map1.closePopup();
    });

    L.DomEvent.on(destBtn, 'click', function() {
        control.spliceWaypoints(control.getWaypoints().length - 1, 1, e.latlng);
        map1.closePopup();
    });

    L.popup()
        .setContent(container)
        .setLatLng(e.latlng)
        .openOn(map1);
});
