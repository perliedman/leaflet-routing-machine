Leaflet Routing Machine [![NPM version](https://badge.fury.io/js/leaflet-routing-machine.png)](http://badge.fury.io/js/leaflet-routing-machine)
=======================

Find the way from A to B on a Leaflet map, using [OSRM](http://project-osrm.org/) as backend.

Watch the [Leaflet Routing Machine demo](http://www.liedman.net/leaflet-routing-machine/).

## Features

* Show returned route on a map
* Edit start, end and waypoint points on the map
* Geocoding to search start, end and waypoint locations from text
* Wrapper to handle OSRM's API

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

By default, the control lets the user add new waypoints by both drag-n-drop on the route's line
in the map, or by adding new waypoints in the control's sidebar.

Unless geocoding is enabled (see below), your code should set start and end waypoints for the control,
since it can otherwise only be done by typing location names.

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

### Getting and modifying waypoints

The waypoints can be modified externally with either ```setWaypoints``` or ```spliceWaypoints```:

```js
// Replace existing waypoints:
control.setWaypoints([
    L.latLng(57.74, 11.94),
    L.latLng(57.6792, 11.949)
]);

// Add a new waypoint before the current waypoints
control.spliceWaypoints(0, 0, L.latLng(57.68, 11.98));

// Remove the first waypoint
control.spliceWaypoints(0, 1);
```

### Building

To build the packaged files in ```dist```, run

```sh
npm install
```

This requires [Node and npm](http://nodejs.org/), as well as Make, which should be available on UNIXy systems, and installable via for example [Cygwin](http://www.cygwin.com/) if you're on Windows.

### Advanced

To customize interactions, you can use the underlying classes that ```L.Routing.Control``` ties together:

* ```L.Routing.Plan```
* ```L.Routing.Itinerary```
* ```L.Routing.Line```
* ```L.Routing.OSRM```

### L.Routing.Itinerary

Displays itineraries as text in a control.

### L.Routing.Line

Displays a route on the map, and allows moving waypoints, as well as adding new waypoints.

### L.Routing.OSRM

Handles communication with the OSRM backend, building the request and parsing the response.

## API

### IRouter

#### Methods

* ```Route(waypoints, callback, context)``` - attempt to route through the provided waypoints, where each waypoint is an
  ```IWaypoint```. Calls ```callback(err, routes)``` in the provided ```context``` when done or if an error is encountered, where:
    * ```err``` is an ```IError``` or ```null``` if no error
    * ```data``` is an array of ```IRoute``` alternatives if ```err``` is ```null```

### IWaypoint

#### Properties

* ```latLng```: an ```L.LatLng``` for the geographic location of the waypoint
* ```name```: a string representing the name of the waypoint, typically an address; 
optional and possibly ```null``` or ```undefined```.

### IRoute

Describes a route through a number of waypoints.

#### Properties

* ```name``` (string) - a descriptive name for this route
* ```summary``` (object) - an object containing two properties:
    * ```totalTime``` (Number) - estimated time for the route, in seconds
    * ```totalDistance``` (Number) - distance for the route, in meters
* ```coordinates``` ([```L.LatLng```]) - an array of ```L.LatLng```s that can be used
  to visualize the route; the level of detail should be high, since
  Leaflet will simplify the line appropriately when it is displayed
* ```waypoints``` - [```L.LatLng```] - the waypoints for this route
* ```instructions``` - [```IInstruction```] - instructions for this route

### IInstruction

Describes a part of a route's itinerary, such as a turn. Can be of two types: either
a ```text``` property containing the exact text to be shown to the user, a number of
properties that describe the instruction in an abstract form; the latter can later be
translated to different languages, while explicit text can't.

#### Properties

Mandatory:

* ```distance``` (Number) - distance in meters for this segment
* ```time``` (Number) - estimated time in seconds for this segment

Combined with either:

* ```text``` (string) - explicit instruction text

or:

* ```type``` (string) - one of the enumerated instruction types (see below)
* ```road``` (String) - name of road for this segment, if available
* ```direction``` (String) - aproximate compass direction: N, NE, E, SE, S, SW, W, NW
* ```exit``` (Integer, optional) - for roundabouts, designates the number of the exit to take

#### Types

* ```Straight```
* ```SlightRight```
* ```Right```
* ```SharpRight```
* ```TurnAround```
* ```SharpLeft```
* ```Left```
* ```SlightLeft```
* ```WaypointReached```
* ```Roundabout```
* ```StartAt```
* ```DestinationReached```
* ```EnterAgainstAllowedDirection```
* ```LeaveAgainstAllowedDirection```

### IError

#### Properties

* ```status```: status/error code (possibly technical); string or number
* ```message```: human-readable error message

