Leaflet Routing Machine
=======================

Find the way from A to B on a Leaflet map, using [OSRM](http://project-osrm.org/) as backend.

This is a work in progress, most functionality is very basic.

Watch the [Leaflet Routing Machine demo](http://www.liedman.net/leaflet-routing-machine/).

## Features

* Wrapper to handle OSRM's API
* Show returned route on a map
* Edit start, end and via points on the map

## Usage

Searching, displaying and editing a route is a complex problem with several moving parts. Leaflet Routing Machine aims to solve this problem while at offering the ability to customize how the user interacts with the routing software.

The API consists of two classes: ```L.Routing.OSRM``` and ```L.Routing.Line```.

### L.Routing.OSRM

Handles communication with the OSRM backend, building the request and parsing the response.

### L.Routing.Line

Displays a route on the map, and allows moving start, end and via points, as well as adding new via points.
