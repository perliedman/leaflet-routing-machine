var map1 = L.map('map-1', { scrollWheelZoom: false });

L.tileLayer('https://a.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}{r}.png?access_token=' + LRM.apiToken, {
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
    })
    .on('routingerror', function(e) {
        try {
            map1.getCenter();
        } catch (e) {
            map1.fitBounds(L.latLngBounds(control.getWaypoints().map(function(wp) { return wp.latLng; })));
        }

        handleError(e);
    })
    .addTo(map1);

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

(function() {
    'use strict';

    L.Routing.routeToGeoJson = function(route) {
        var wpNames = [],
            wpCoordinates = [],
            i,
            wp,
            latLng;

        for (i = 0; i < route.waypoints.length; i++) {
            wp = route.waypoints[i];
            latLng = L.latLng(wp.latLng);
            wpNames.push(wp.name);
            wpCoordinates.push([latLng.lng, latLng.lat]);
        }

        return {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {
                        id: 'waypoints',
                        names: wpNames
                    },
                    geometry: {
                        type: 'MultiPoint',
                        coordinates: wpCoordinates
                    }
                },
                {
                    type: 'Feature',
                    properties: {
                        id: 'line',
                    },
                    geometry: L.Routing.routeToLineString(route)
                }
            ]
        };
    };

    L.Routing.routeToLineString = function(route) {
        var lineCoordinates = [],
            i,
            latLng;

        for (i = 0; i < route.coordinates.length; i++) {
            latLng = L.latLng(route.coordinates[i]);
            lineCoordinates.push([latLng.lng, latLng.lat]);
        }

        return {
            type: 'LineString',
            coordinates: lineCoordinates
        };
    };
})();


control.on('routesfound', function(e) {
    console.log(L.Routing.routeToGeoJson(e.routes[0]));
});

L.Routing.errorControl(control).addTo(map1);
