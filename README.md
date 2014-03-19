Leaflet Routing Machine [![NPM version](https://badge.fury.io/js/leaflet-routing-machine.png)](http://badge.fury.io/js/leaflet-routing-machine)
=======================

Find the way from A to B on a Leaflet map, using [OSRM](http://project-osrm.org/) as backend.

Watch the [Leaflet Routing Machine demo](http://www.liedman.net/leaflet-routing-machine/).

## Features

* Wrapper to handle OSRM's API
* Show returned route on a map
* Edit start, end and waypoint points on the map
* Geocoding to search start, end and waypoint locations from text

## Usage

Searching, displaying and editing a route is a complex problem with several moving parts. Leaflet Routing Machine aims to solve this problem while at offering the ability to customize how the user interacts with the routing software.

### Installing

To use Leaflet Routing Machine, copy the files under the ```dist``` folder to where you store you scripts and CSS.

If you use NPM and Browserify (or similar), you can also do:

```
npm install --save leaflet-routing-machine
```

### Basics

Quickest way to get routing on your map is to use ```L.Routing.Control```:

Include script and CSS:

```HTML
<link rel="stylesheet" href="leaflet-routing-machine.css" />
<script src="leaflet-routing-machine.min.js"></script>
```

Create a map and add the routing control:

```js
var map = L.map('map');

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

L.Routing.control({
    waypoints: [
        L.latLng(57.74, 11.94),
        L.latLng(57.6792, 11.949)
    ]
}).addTo(map);
```

### Geocoding support

To let the user enter location addresses, a so called geocoder must be used. OSRM does not
provide a geocoding service, so an external service has to be used. Leaflet Routing Machine
can support any geocoding service, as long as it implements the [IGeocoder](https://github.com/perliedman/leaflet-control-geocoder#igeocoder) interface used by [Leaflet Control Geocoder](https://github.com/perliedman/leaflet-control-geocoder). An easy alternative (used by the examples) is to simply use Leaflet Control Geocoder straight away.

Enable the geocoder with options when creating the control:

```js
L.Routing.control({
    geocoder: L.Control.Geocoder.nominatim()
}).addTo(map);
```

(This example assumes Leaflet Control Geocoder has already been loaded.)

### Building

To build the packaged files in ```dist```, run

```sh
npm install
```

This requires [Node and npm](http://nodejs.org/), as well as Make, which should be available on UNIXy systems, and installable via for example [Cygwin](http://www.cygwin.com/) if you're on Windows.

### Advanced

To customize interactions, you can use the underlying classes that ```L.Routing.Control``` ties together:

* ```L.Routing.OSRM```
* ```L.Routing.Line```
* ```L.Routing.Itinerary```

### L.Routing.OSRM

Handles communication with the OSRM backend, building the request and parsing the response.

### L.Routing.Line

Displays a route on the map, and allows moving waypoints, as well as adding new waypoints.

### L.Routing.Itinerary

Displays itineraries as text in a control.
