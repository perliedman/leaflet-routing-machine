---
layout: tutorial
title: Geocoders tutorial
---

## Addresses and geocoders

Routing and addresses are tightly coupled. Perhaps the most common use case for routing
if to get from address A to address B, where the user does not necessarily know the
geographic location of those addresses. Since the routing software can only route
between locations, latitudes and longitudes, the software needs a way to look up the
coordinate of an address. This process is known as *geocoding*, looking up
the latitude and longitude from an address string. 

Likewise, it is common to put a waypoint on the map, and let the system look up the
address of the waypoint. This is known as *reverse geocoding*, mapping a
geographic location to an address string.

Although crucial to routing, Leaflet Routing Machine does not come with a builtin
geocoder or reverse geocoder. There are quite a few geocoding services available,
and instead of Leaflet Routing Machine choosing one for you, it lets you connect
to the geocoding service of your choice. Luckily, adding geocoding is easy.

### Adding a geocoding service

In Leaflet Routing Machine, geocoders work as a form of plugin. Geocoders must be
written to conform with the interface used by [Leaflet Control Geocoder](https://github.com/perliedman/leaflet-control-geocoder)
(from the same author as Leaflet Routing Machine). This means that by simply including
the file 
[Control.Geocoder.js](https://github.com/perliedman/leaflet-control-geocoder/blob/master/Control.Geocoder.js),
it will be possible to use these geocoding services

* [Nominatim](http://wiki.openstreetmap.org/wiki/Nominatim)
* [Bing Locations API](http://msdn.microsoft.com/en-us/library/ff701715.aspx)
* [Google Geocoding API](https://developers.google.com/maps/documentation/geocoding/)
* [MapQuest Geocoding API](https://www.mapbox.com/developers/api/geocoding/)

Once you have a geocoding service loaded, you need to tell Leaflet Routing Machine to use it.
This is done by adding the option `geocoder` to the control's options, specifying the geocoder
instance to use:

<pre data-line="7"><code class="language-javascript">L.Routing.control({
    waypoints: [
        L.latLng(57.74, 11.94),
        L.latLng(57.6792, 11.949)
    ],
    routeWhileDragging: true,
    geocoder: L.Control.Geocoder.nominatim()
}).addTo(map);</code></pre>

See [Leaflet Control Geocoder's API](https://github.com/perliedman/leaflet-control-geocoder#api) for
more information about the classes used, and their options.

Adding a geocoder will change the way the control works in two major ways:

1) Input fields for the waypoints' addresses will be added to the control's panel
2) Moving a waypoint by dragging it in the map, for example, will automatically look
up the address of the new location and update the address field

This is an example of what it looks like:

<div id="map-1" class="map"></div>

### Autocomplete

Leaflet Routing Machine supports autocomplete (or type ahead, as it's sometimes called), meaning it
can try to suggest addresses as the user types in an address field. To use this feature, the
underlying geocoder service must support it. Support is added by giving the geocoder a method
called `suggest`, which takes the same arguments as the `geocode` method.

Note that the perhaps most commonly used geocoder, Nominatim, does __not__ have autocomplete, since
its [usage policy explicitly forbids it](http://wiki.openstreetmap.org/wiki/Nominatim_usage_policy#Unacceptable_Use).

Below is an example of autocomplete/type ahead, with Mapbox's geocoding service (currently works best
in the U.S.). Go ahead, select one of the addresses and start typing. When you pause for a bit, suggestions
based on what you've typed so far will appear.

<div id="map-2" class="map"></div>

### Unknown addresses

As mentioned above, a reverse geocoding will be made every time a waypoint's location changes,
to reflect its new address. But what happens if there is no address for the location? This typically
happens the waypoint is placed outside inhabited areas, like in the woods, mountains or similar.

For these cases, Leaflet Routing Machine has a fallback that generates a waypoint name. By default, a
representation of its latitude and longitude will be used, like "N38.1086, W122.1762".

If you want to override this behaviour, you can provide the option `waypointNameFallback`, which is
a function that given the waypoint `L.LatLng` should return a name. Here's an example of how to replace
the default with [sexagesimal](http://en.wikipedia.org/wiki/Sexagesimal) format of the location:

<pre><code class="language-javascript">L.Routing.control({
    [...]
    waypointNameFallback: function(latLng) {
        function zeroPad(n) {
            n = Math.round(n);
            return n &lt; 10 ? '0' + n : n;
        }
        function sexagesimal(p, pos, neg) {
            var n = Math.abs(p),
                degs = Math.floor(n),
                mins = (n - degs) * 60,
                secs = (mins - Math.floor(mins)) * 60,
                frac = Math.round((secs - Math.floor(secs)) * 100);
            return (n >= 0 ? pos : neg) + degs + '°' +
                zeroPad(mins) + '\'' +
                zeroPad(secs) + '.' + zeroPad(frac) + '"';
        }

        return sexagesimal(latLng.lat, 'N', 'S') + ' ' + sexagesimal(latLng.lng, 'E', 'W');
    }
})</code></pre>

### Implementing your own geocoder

For some cases, you might want to use a geocoding service that is not supported by Leaflet Control
Geocoder. This can be done easily by implementing the same interface (contract) that for your
service. [IGeocoder](https://github.com/perliedman/leaflet-control-geocoder#igeocoder) lists which
methods you need to implement; optionally you might want to add `suggest` as well, as mentioned
under the Autocomplete heading above.

Then simply pass your own geocoder instance to the `geocoder` option, just like the examples above.


<script src="index.js"></script>
