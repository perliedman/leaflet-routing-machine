[Leaflet Routing Machine]((http://www.liedman.net/leaflet-routing-machine/)) [![NPM version](https://img.shields.io/npm/v/leaflet-routing-machine.svg)](https://www.npmjs.com/package/leaflet-routing-machine) ![Leaflet 1.0 compatible!](https://img.shields.io/badge/Leaflet%201.0-%E2%9C%93-1EB300.svg?style=flat) [![Join the chat at https://gitter.im/leaflet-routing-machine/Lobby](https://badges.gitter.im/leaflet-routing-machine/Lobby.svg)](https://gitter.im/leaflet-routing-machine/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
=======================

Find the way from A to B on a Leaflet map. The plugin supports multiple backends:

* [OSRM](http://project-osrm.org/) - builtin and used by default (version 5)
* [Mapbox Directions API](https://www.mapbox.com/developers/api/directions/) - builtin with the class `L.Routing.Mapbox`
* [GraphHopper](https://graphhopper.com/) - through plugin [lrm-graphopper](https://github.com/perliedman/lrm-graphhopper)
* [Mapzen Valhalla](https://mapzen.com/projects/valhalla/) - through plugin [lrm-valhalla](https://github.com/valhalla/lrm-valhalla)
* [TomTom Online Routing API](http://developer.tomtom.com/io-docs) - through plugin [lrm-tomtom](https://github.com/mrohnstock/lrm-tomtom) by [Mathias Rohnstock](https://github.com/mrohnstock)
* Legacy support for OSRM version 4 through plugin [lrm-osrm4](https://github.com/perliedman/lrm-osrm4)
* Esri - through plugin [lrm-esri](https://github.com/jgravois/lrm-esri)

## Features

* Standard Leaflet control, with Leaflet look and feel
* Routing from start to destination, with possibility of via points
* Add, edit and remove waypoints through both address input and using the map
* Multiple language support
* Highly customizable for advanced use
* Customizable look (theming / skins)
* Open Source released under ISC License (more or less equivalent with the MIT license)

__Go to the [Leaflet Routing Machine site](http://www.liedman.net/leaflet-routing-machine/) for more information, demos, tutorials and more.__

## Support and New Features

Leaflet Routing Machine is in many ways already a feature complete routing UI. Most likely, your requirements are already covered and require very little adaptation.

If you have more complex requirements, need new features or just need some support, I am open to doing paid custom work and support around Leaflet Routing Machine for your organization. Contact me at [per@liedman.net](mailto:per@liedman.net) and we'll sort this out!

For questions and discussions, you might want to look at [the Leaflet Routing Machine gitter](https://gitter.im/leaflet-routing-machine/Lobby).

## Building

```sh
npm install
```

This requires [Node and npm](http://nodejs.org/), as well as `grunt`.
