---
layout: tutorial
title: Integration tutorial
---

## Integration

Usually, you want to integrate Leaflet Routing Machine's functionality with other functions in your page or app. This tutorial will show you some
common use cases and illustrates the integration points that are available in Leaflet Routing Machine.

### Events

Like many other JavaScript libraries in general, and Leaflet and its plugins in particular, _events_ are an important mechanism for integration and adding functionality.

Most parts of Leaflet Routing Machine will fire events that your code can listen for, and take action. This uses [Leaflet's event system](http://leafletjs.com/reference-1.0.3.html#evented), so if you are not familiar with it, now might be a good time to read up on it.

All events of the different components in Leaflet Routing Machine are documented in the [Leaflet Routing Machine API docs](/api/).

### Handling Routes - taking action on new routes

A common scenario is that your app wants to do something once a route has been calculated and displayed in Leaflet Routing Machine. 

JavaScript and Leaflet Routing Machine are asynchronous: when a request for a route is sent, the code doesn't halt to wait for the response, but continues immediately. The route will be available at some later point. Because of this, there's no function like `getRoute()` or similar in Leaflet Routing Machine: if you need to access a route, you should instead listen for events, that will tell you when routes have been received from the routing backend, or when a route is displayed in the map.

The control will fire a `routesfound` event once the backend returns one or more route as a response to a routing request.

<pre data-line="9-12"><code class="language-javascript">L.Routing.control({
        waypoints: [
            L.latLng(57.74, 11.94),
            L.latLng(57.6792, 11.949)
        ],
        routeWhileDragging: true,
        geocoder: L.Control.Geocoder.nominatim()
    })
    .on('routesfound', function(e) {
        var routes = e.routes;
        alert('Found ' + routes.length + ' route(s).');
    })
    .addTo(map);</code></pre>

Similarily, and perhaps more common, is to take some action once a route is
shown in the map and itinerary. The event `routeselected` is fired when
a response is shown to the user, as well as when the user selects an alternative route from the control.

<pre data-line="9-12"><code class="language-javascript">L.Routing.control({
        waypoints: [
            L.latLng(57.74, 11.94),
            L.latLng(57.6792, 11.949)
        ],
        routeWhileDragging: true,
        geocoder: L.Control.Geocoder.nominatim()
    })
    .on('routeselected', function(e) {
        var route = e.route;
        alert('Showing route between waypoints:\n' + JSON.stringify(route.inputWaypoints, null, 2));
    })
    .addTo(map);</code></pre>

Try the (somewhat annoying) result below, drag the waypoints, alerts will popup as new routes are returned and selected:

<div id="map-1" class="map"></div>

See [`RoutingResultEvent`](http://www.liedman.net/leaflet-routing-machine/api/#routingresultevent) and [`RouteSelectedEvent`](http://www.liedman.net/leaflet-routing-machine/api/#routeselectedevent) for more details on data available from these events.

### Spinner - indicate routes are calculated

Depending on the load on your backend, and the users network bandwidth, a routing request can be very quick (which is usually the case with OSRM), or take a while. Displaying some kind of feedback that a request is in progress can be a good idea.

To help with this, Leaflet Routing Machine fires a `routingstart` every time a routing request is sent to the backend. Corresponding to this, a `routesfound` (as shown above) or `routingerror` will fire to indicate success or failure. This can be used to display and hide a spinner:

<pre data-line="9-10"><code class="language-javascript">L.Routing.control({
        waypoints: [
            L.latLng(57.74, 11.94),
            L.latLng(57.6792, 11.949)
        ],
        routeWhileDragging: true,
        geocoder: L.Control.Geocoder.nominatim()
    })
    .on('routingstart', showSpinner)
    .on('routesfound routingerror', hideSpinner)
    .addTo(map);</code></pre>


### Errors

As can be seen in the example above, Leaflet Routing Machine will fire a `routingerror` event if an error occurs during routing. By default, the control will listen for this event and log any errors to the console, but in a more complex application, you probably want to do some more advanced error handling to show the result to the user.

A quick way to add some basic error feedback is to use the built-in `ErrorControl`. It expects you to pass a `L.Routing.Control` to it, and will hook up to the error event:

<pre data-line="10"><code class="language-javascript">var control = L.Routing.control({
        waypoints: [
            L.latLng(57.74, 11.94),
            L.latLng(57.6792, 11.949)
        ],
        routeWhileDragging: true,
        geocoder: L.Control.Geocoder.nominatim()
    });

L.Routing.errorControl(control).addTo(map);
</code></pre>

The default console error handling can be disabled by passing the option `defaultErrorHandler` to `false`.

<script src="index.js"></script>
