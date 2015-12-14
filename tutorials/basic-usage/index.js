var map = L.map('map', { scrollWheelZoom: false });

L.tileLayer('https://a.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=' + LRM.apiToken, {
    attribution: 'Maps by <a href="https://www.mapbox.com/about/maps/">MapBox</a>. ' +
        'Routes from <a href="http://project-osrm.org/">OSRM</a>, ' +
        'data uses <a href="http://opendatacommons.org/licenses/odbl/">ODbL</a> license'
}).addTo(map);

var control = L.Routing.control({
    waypoints: [
        L.latLng(57.74, 11.94),
        L.latLng(57.6792, 11.949)
    ],
    routeWhileDragging: true
}).addTo(map);

L.Routing.errorControl(control).addTo(map);
