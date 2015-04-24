---
layout: tutorial
title: GraphHopper, Mapbox and other routing software
---

## GraphHopper, Mapbox and other routing software

Behind the UI, Leaflet Routing Machine queries [OSRM](http://project-osrm.org)'s 
servers each time the route is recalculated, unless you tell it to use something else.
This is great for normal use: the service is free, OSRM is both good as well as *very*
quick. However, there are cases where OSRM's defaults doesn't cut it: you want to
do bike routing, while OSRM's open servers only route for cars at the time of writing.
The free servers comes with no SLA, which might be another cause to use another server.

### Table of contents

* [Using your own OSRM server](#osrm)
* [GraphHopper](#graphhopper)
* [Mapbox directions API](#mapbox)
* [TomTom online routing API](#tomtom)
* [Using other routers](#other-routers)
* [Preventing excessive requests (and bills)](#prevent-requests)

### <a name="osrm"></a> Using your own OSRM server

If it's just the configuration and/or reliablity of the free servers that you need to
control yourself, you can quite easily [set up your own OSRM server](https://github.com/Project-OSRM/osrm-backend/wiki/Running-OSRM).
When you have it running, using it with Leaflet Routing Machineis a matter of telling
telling it where the server is located:

```language-javascript
L.Routing.control({
    [...]
    serviceUrl: 'http://my-osrm/viaroute'
});
```

Under the hood, this option will be passed along to the [`L.Routing.OSRM`]({{site.baseurl}}/api#l-routing-osrm)
instance that is implicitly created with your control; this is the control's *router*.

You can also, more explicitly, hand the router instance to use directly to the control:

```language-javascript
L.Routing.control({
    [...]
    router: L.Routing.osrm({
        serviceUrl: 'http://my-osrm/viaroute'
    })
});
```

### <a name="graphhopper"></a> GraphHopper

Another popular, open source routing software is [GraphHopper](https://graphhopper.com/). It's fast, works
well with OpenStreetMap data and runs on a lot of platforms (even on Android).

To use switch to using GraphHopper with Leaflet Routing Machine, you need to use the plugin 
[lrm-graphhopper](https://github.com/perliedman/lrm-graphhopper). You can 
[download lrm-graphhopper](http://www.liedman.net/lrm-graphhopper/download/) and insert the
JavaScript file into your page right after where it loads Leaflet Routing Machine:

<pre><code class="language-markup">[...]
&lt;script src=&quot;leaflet-routing-machine.js&quot;&gt;&lt;/script&gt;
&lt;script src=&quot;lrm-graphhopper.js&quot;&gt;&lt;/script&gt;
[...]</code></pre>

Now you need to give the GraphHopper router to Leaflet Routing Machine's control:

```language-javascript
L.Routing.control({
    [...]
    router: L.Routing.graphHopper('apiKey');
});
```

Like OSRM, the GraphHopper router will by default use GraphHopper's public servers. You need to
[register](https://graphhopper.com/dashboard/#/register) and get an API key to use these, and 
you need to give that API key to the router instance.

If you set up your own GraphHopper server, you don't need the API key, but instead configure the
address of your server:

```language-javascript
L.Routing.control({
    [...]
    router: L.Routing.graphHopper(undefined /* no api key */, {
        serviceUrl: 'http://my-graphhopper/api/v1/route'
    });
});
```

#### Using GraphHopper with npm and Browserify

If you're lucky enough to work with Browserify, the plugin can be installed through npm instead
of downloading the script manually:

```
npm install --save lrm-graphhopper
```

And later required into your source. Note that the plugin, like many Leaflet plugins, will tack
itself on to the main Leaflet object, `L`, so there's no explicit need to save the result you'll
get back from the `require` statement, although you can if that is how you structure your code.

```language-javascript
var L = require('leaflet');
require('leaflet-routing-machine'); // Adds L.Routing onto L
require('lrm-graphhopper'); // Adds L.Routing.GraphHopper onto L.Routing

L.Routing.control({
    [...]
    router: L.Routing.graphHopper('api-key');
});
```

### <a name="mapbox"></a> Mapbox directions API

Another popular alternative for routing is to use
[Mapbox Directions API](https://www.mapbox.com/developers/api/directions/). The directions API
is a part of Mapbox's platform, so you can't install your own version of it, it's installed, hosted
and supported by Mapbox. You'll need a Mapbox account to use this feature.

First, you need an [API access token](https://www.mapbox.com/account/apps/) to identify that it's 
your account that should be billed for the routing.

Second, you need to use the plugin 
[lrm-mapbox](https://github.com/perliedman/lrm-mapbox). You can 
[download lrm-mapbox](http://www.liedman.net/lrm-mapbox/download/) and insert the
JavaScript file into your page right after where it loads Leaflet Routing Machine:

<pre><code class="language-markup">[...]
&lt;script src=&quot;leaflet-routing-machine.js&quot;&gt;&lt;/script&gt;
&lt;script src=&quot;lrm-mapbox.js&quot;&gt;&lt;/script&gt;
[...]</code></pre>

Now, we are ready to tell Leaflet Routing Machine's control to use Mapbox as router:

```language-javascript
L.Routing.control({
    [...]
    router: L.Routing.mapbox('access-token');
});
```

#### Using Mapbox directions API with npm and Browserify

Like with the GraphHopper plugin, the Mapbox plugin can be installed through npm instead
of downloading the script manually:

```
npm install --save lrm-mapbox
```

Note that the plugin, like many Leaflet plugins, will tack
itself on to the main Leaflet object, `L`, so there's no explicit need to save the result you'll
get back from the `require` statement, although you can if that is how you structure your code.

```language-javascript
var L = require('leaflet');
require('leaflet-routing-machine'); // Adds L.Routing onto L
require('lrm-mapbox'); // Adds L.Routing.Mapbox onto L.Routing

L.Routing.control({
    [...]
    router: L.Routing.mapbox('access-token');
});
```

### <a name="tomtom"></a> TomTom Online Routing API

[Mathias Rohnstock](https://github.com/drmonty) has written a plugin for Leaflet Routing Machine: [lrm-tomtom](https://github.com/drmonty/lrm-tomtom). Check it out!

### <a name="other-routers"></a> Using other routers

You can also build support for other routing software. This way, you can for example use
Leaflet Routing Machine with proprietary routing software of your choice.

The basic requirement is that the router class must implement the 
[`IRouter`]({{site.baseurl}}/api/#irouter) interface, so that Leaflet Routing Machine knows
how to communicate with your router. The interface is pretty simple and contains a single
method:

```language-javascript
router.route(waypoints, callback, context, options)
```

`waypoints` is the array of waypoints the route should pass, and contains at least two
elements when `route` is called; each element will have at least a `latLng` property,
containing a `L.LatLng` that describes the waypoints location, optionally it will also
have a `name` as string and `options`.

Since routing will most likely be an asynchronous operation, the `route` method isn't
expected to return a result, but rather call the provided `callback` function when
the result has been calculated. The callback takes two arguments, like the Node.js
convention: the first argument is an error, and is set to a falsy value if no error
occured; in this case the other argument is the result, an array of route alternatives
with at least one element.

A route is defined by the [`IRoute`]({{site.baseurl}}/api#iroute) interface, and
should among many things contain a description of the route's geometry, the
instructions for the route, as well as summaries of the total distance and expected
time for the route.

By implementing these interfaces, you will get all the other functionality of
Leaflet Routing Machine for free.

### <a name="prevent-requests"></a> Preventing excessive requests (and bills)

Several routing services bill you per routing requests, or take very long time to
respond to a request. In these scenarios, it might
be required to reduce the number of routing requests made by Leaflet Routing Machine.

The first trick, which will makes the largest reduction in number of requests, is to
disable the `routeWhileDragging` option for the control, if you have it enabled.
While it definitely looks cool and gives great feedback to the user, it costs *a lot*
of requests.

Another, more dramatic step, is to disable automatic routing altogether. By default,
the control will make a routing request every time a waypoint is changed (when
a waypoint marker is released after dragging, when an address is updated in the
input fields, etc.). However, you can disable this, and only make the control route
when you explicitly ask it to. This can be achieved by setting the option
`autoRoute` to `false`. When doing so, the control will *only* calculate a route
when the control's `route` method is called. The method takes no arguments, but
routes through the currently selected waypoints. You will need to implement a way
(a button, for example), that calls the `route` method.
