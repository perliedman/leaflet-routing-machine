'use strict';

var L = require('leaflet');
var GeocoderElement = require('./geocoder-element');

module.exports = L.Class.extend({
    onAdd: function(map) {
        var container = L.DomUtil.create('div', 'leaflet-routing-geocoders ' + this.options.geocodersClassName),
            waypoints = this._waypoints,
            addWpBtn,
            reverseBtn;

        this._geocoderContainer = container;
        this._geocoderElems = [];


        if (this.options.addWaypoints) {
            addWpBtn = L.DomUtil.create('button', 'leaflet-routing-add-waypoint ' + this.options.addButtonClassName, container);
            addWpBtn.setAttribute('type', 'button');
            L.DomEvent.addListener(addWpBtn, 'click', function() {
                this.spliceWaypoints(waypoints.length, 0, null);
            }, this);
        }

        if (this.options.reverseWaypoints) {
            reverseBtn = L.DomUtil.create('button', 'leaflet-routing-reverse-waypoints', container);
            reverseBtn.setAttribute('type', 'button');
            L.DomEvent.addListener(reverseBtn, 'click', function() {
                this._waypoints.reverse();
                this.setWaypoints(this._waypoints);
            }, this);
        }

        this._updateGeocoders();
        this.on('waypointsspliced', this._updateGeocoders);

        return container;
    }
});
