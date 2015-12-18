[Leaflet Routing Machine]((http://www.liedman.net/leaflet-routing-machine/)) [![NPM version](https://badge.fury.io/js/leaflet-routing-machine.png)](http://badge.fury.io/js/leaflet-routing-machine)
=======================

Find the way from A to B on a Leaflet map. The plugin supports multiple backends:

* [OSRM](http://project-osrm.org/) - builtin and used by default
* [GraphHopper](https://graphhopper.com/) - through plugin [lrm-graphopper](https://github.com/perliedman/lrm-graphhopper)
* [Mapzen Valhalla](https://mapzen.com/projects/valhalla/) - through plugin [lrm-valhalla](https://github.com/valhalla/lrm-valhalla)
* [Mapbox Directions API](https://www.mapbox.com/developers/api/directions/) - through plugin [lrm-mapbox](https://github.com/perliedman/lrm-mapbox)
* [TomTom Online Routing API](http://developer.tomtom.com/io-docs) - through plugin [lrm-tomtom](https://github.com/mrohnstock/lrm-tomtom) by [Mathias Rohnstock](https://github.com/mrohnstock)

## Features

* Standard Leaflet control, with Leaflet look and feel
* Routing from start to destination, with possibility of via points
* Add, edit and remove waypoints through both address input and using the map
* Multiple language support
* Highly customizable for advanced use
* Customizable look (theming / skins)
* Open Source released under ISC License (more or less equivalent with the MIT license)

### Go to the [Leaflet Routing Machine site](http://www.liedman.net/leaflet-routing-machine/) for more information, demos, tutorials and more.

## Building

```sh
npm install
```

This requires [Node and npm](http://nodejs.org/), as well as `grunt`.
