---
layout: tutorial
title: GraphHopper, Mapbox, Valhalla and other routing software
---

## GraphHopper, Mapbox, Valhalla and other routing software

Behind the UI, Leaflet Routing Machine queries [OSRM](http://project-osrm.org)'s
demo servers each time the route is recalculated, unless you tell it to use something else.
This is great for a demo, but not for production: the service is free but comes with a [usage policy](https://github.com/Project-OSRM/osrm-backend/wiki/Api-usage-policy) and without any warranties or SLA.
For production use, or for any use case were you need control over how routes are calculated (like other means of transport, like bike or foot), you need to use another server, be it OSRM or some other software. This tutorial tells you about the different options.

### Using your own OSRM server

If it's just the configuration and/or reliablity of the free servers that you need to
control yourself, you can quite easily [set up your own OSRM server](https://github.com/Project-OSRM/osrm-backend/wiki/Running-OSRM).
When you have it running, using it with Leaflet Routing Machineis a matter of telling
telling it where the server is located:

<pre><code class="language-javascript">
L.Routing.control({
    waypoints: [...],
    serviceUrl: 'http://my-osrm/route/v1'
    // your other options go here
});
</code></pre>

Under the hood, this option will be passed along to the [`L.Routing.OSRM`]({{site.baseurl}}/api#l-routing-osrm)
instance that is implicitly created with your control; this is the control's *router*.

You can also, more explicitly, hand the router instance to use directly to the control:

<pre><code class="language-javascript">
L.Routing.control({
    waypoints: [...],
    router: L.Routing.osrmv1({
        serviceUrl: 'http://my-osrm/route/v1'
    })
    // your other options go here
});
</code></pre>

### Mapbox directions API

Another popular alternative for routing is to use
[Mapbox Directions API](https://www.mapbox.com/developers/api/directions/). The directions API
is a part of Mapbox's platform, so you can't install your own version of it: it's installed, hosted
and supported by Mapbox. You'll need a Mapbox account to use this feature.

First, you need an [API access token](https://www.mapbox.com/account/apps/) to identify that it's
your account that should be billed for the routing.

Once you have an access token, support for Mapbox directions is already built into Leaflet Routing Machine,
you just need to specify that you want to use the Mapbox router:

<pre><code class="language-javascript">
L.Routing.control({
    waypoints: [...],
    router: L.Routing.mapbox('your-access-token-here')
    // your other options go here
});
</code></pre>

### GraphHopper

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

<pre><code class="language-javascript">
L.Routing.control({
    waypoints: [...],
    router: L.Routing.graphHopper('apiKey')
    // your other options go here
});
</code></pre>

Like OSRM, the GraphHopper router will by default use GraphHopper's public servers. You need to
[register](https://graphhopper.com/dashboard/#/register) and get an API key to use these, and
you need to give that API key to the router instance.

If you set up your own GraphHopper server, you don't need the API key, but instead configure the
address of your server:

<pre><code class="language-javascript">
L.Routing.control({
    waypoints: [...],
    router: L.Routing.graphHopper(undefined /* no api key */, {
        serviceUrl: 'http://my-graphhopper/api/v1/route'
    })
    // your other options go here
});
</code></pre>

#### Using GraphHopper with npm and Browserify

If you're lucky enough to work with Browserify, the plugin can be installed through npm instead
of downloading the script manually:

<pre><code>
npm install --save lrm-graphhopper
</code></pre>

And later required into your source. Note that the plugin, like many Leaflet plugins, will tack
itself on to the main Leaflet object, `L`, so there's no explicit need to save the result you'll
get back from the `require` statement, although you can if that is how you structure your code.

<pre><code class="language-javascript">
var L = require('leaflet');
require('leaflet-routing-machine'); // Adds L.Routing onto L
require('lrm-graphhopper'); // Adds L.Routing.GraphHopper onto L.Routing

L.Routing.control({
    waypoints: [...],
    router: L.Routing.graphHopper('api-key')
    // your other options go here
});
</code></pre>

### Mapzen Valhalla

[Mapzen Valhalla](https://mapzen.com/projects/valhalla/) is supported through Mapzen's own plugin [lrm-valhalla](https://github.com/valhalla/lrm-valhalla).

Download prebuilt files: [http://mapzen.com/resources/lrm-valhalla-0.0.9.zip](http://mapzen.com/resources/lrm-valhalla-0.0.9.zip)

Load this file with a `&lt;script&gt;` tag in your page, after Leaflet and Leaflet Routing Machine has been loaded.

Or, to use with for example Browserify:

<pre><code>
npm install --save lrm-valhalla
</code></pre>

See the [lrm-valhalla](https://github.com/valhalla/lrm-valhalla) project page for info and docs on using the plug-in as well as the Valhalla API reference.

### TomTom Online Routing API

[Mathias Rohnstock](https://github.com/mrohnstock) has written a plugin for Leaflet Routing Machine: [lrm-tomtom](https://github.com/mrohnstock/lrm-tomtom). Check it out!

### Using other routers

You can also build support for other routing software. This way, you can for example use
Leaflet Routing Machine with proprietary routing software of your choice.

The basic requirement is that the router class must implement the
[`IRouter`]({{site.baseurl}}/api/#irouter) interface, so that Leaflet Routing Machine knows
how to communicate with your router. The interface is pretty simple and contains a single
method:

<pre><code class="language-javascript">
router.route(waypoints, callback, context, options)
</code></pre>

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

### Preventing excessive requests (and bills)

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
