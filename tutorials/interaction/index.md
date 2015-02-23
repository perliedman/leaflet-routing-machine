---
layout: tutorial
title: Interaction tutorial
---

## Interaction

This tutorials focuses on making the rest of your app and Leaflet interact with
the routing plugin. It shows you how to accomplish some common tasks by calling
functions within Leaflet Routing Machine, for example to add new waypoints,
modify waypoints or reversing the route.

### Adding waypoints by clicking the map

By default, the control does not allow the user to add waypoints to the route
by clicking the map. The reason is that exactly how this is done varies greatly
from application to application; instead of the control deciding how it should work and
what it should look like, this is left to the app to decide.

Below is a very basic example of what it can look like. By clicking the map,
a popup is brought up, from which the user can select the clicked location as
start point or destination for the route. Via points can be added by dragging
the route's line in the map, once a start and destination has been added. 

<div id="map-1" class="map"></div>

Lets go through the modifications necessary to make this happen.

First, we need to add a popup when the map is clicked. This code is nothing
specific for Leaflet Routing Machine, but rather an example of how you can
build basic user interfaces with Leaflet's builtin functionality, without the
use of for example jQuery or similar.

<pre><code class="language-javascript">function createButton(label, container) {
    var btn = L.DomUtil.create('button', '', container);
    btn.setAttribute('type', 'button');
    btn.innerHTML = label;
    return btn;
}

map.on('click', function(e) {
    var container = L.DomUtil.create('div'),
        startBtn = createButton('Start from this location', container),
        destBtn = createButton('Go to this location', container);

    L.popup()
        .setContent(container)
        .setLatLng(e.latlng)
        .openOn(map);
});</code></pre>

Adding this should give you a popup once the map is clicked.

Now we need to make something happen when the buttons are clicked. This
is the part where we actually interact with Leaflet Routing Machine's
control. This code assumes the routing control instance is stored in `control`.

When the "Start from this location" button is clicked, the first waypoint of
the route should be replaced with the location that the user clicked on.
Modifying the waypoints can be done with the method `spliceWaypoints`, which
mimics the behavior of JavaScript's own [`Array.splice`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice): with it, you
can both add and remove waypoints, even in one operation.

To replace the first waypoint, you simply tell Leaflet Routing Machine to
remove one waypoint at index 0 (the first), and then add a new at the clicked
location. Add this code inside the map's click event handler; `e` will still
refer to the click event, and `e.latlng` is the location clicked:

<pre data-line="2"><code class="language-javascript">    L.DomEvent.on(startBtn, 'click', function() {
        control.spliceWaypoints(0, 1, e.latlng);
        map1.closePopup();
    });
</code></pre>

Similarily, setting the destination is a matter of removing the last waypoint (remember there
can be more than two, if there are via points) and adding a new at the clicked location:

<pre data-line="2"><code class="language-javascript">    L.DomEvent.on(destBtn, 'click', function() {
        control.spliceWaypoints(control.getWaypoints().length - 1, 1, e.latlng);
        map1.closePopup();
    });
</code></pre>

As can be seen in the code above, the current waypoints can also be accessed with the `getWaypoints`
method.

### Reversing the route

It is common to have button to reverse the direction of the route (i.e. reverse the list of waypoints).
Lets go through the steps necessary to implement such a button.

First, where should we put the button? One suggestion would be to put it next to the button that adds
a waypoint to the route, below the last address input field. But how do you add something to that panel,
since it is created by Leaflet Routing Machine? We will use pattern that is common when you want to
customize parts of the control's user interface: we will extend the implementing class and override the
method that is responsible for creating the UI.

In this case, we need to override the control's [`L.Routing.Plan`]({{site.baseurl/api#l-routing-plan}}),
since its method `createGeocoders` is what creates the panel we're going to add a button to.

```language-javascript
var ReversablePlan = L.Routing.Plan.extend({
    createGeocoders: function() {
        var container = L.Routing.Plan.prototype.createGeocoders.call(this),
            reverseButton = createButton('&#8593;&#8595;', container);
        return container;
    }
}
```

We're creating a new class, `ReversablePlan`, that inherits from `L.Routing.Plan`, with one single
overridden method, `createGeocoders`. We're using our utility method `createButton` from the example
above to create the button. Also note how we call the base implementation of `createGeocoders`, and
simply add the new button to the panel returned by that method, before returning the panel.

Having added the new button, we simply need to attach a listener to it, and make it reverse the route.
We add this code inside the `createGeocders` method, before returning the container:

```language-javascript
        L.DomEvent.on(reverseButton, 'click', function() {
            var waypoints = this.getWaypoints();
            this.setWaypoints(waypoints.reverse());
        }, this);
```

We get the current waypoints with `getWaypoints`, which returns an array. We then use JavaScript's
builtin method `reverse` to flip the order of the array, and finally set the waypoints to the reversed
array with `setWaypoints`. Simple, right?

The more observant readers will note that `this` in the code will be the instance of the `ReversablePlan`,
not the routing control itself, but in the first example `getWaypoints` was a method on the control, now
it appears to be a method on the plan - what is going on? The truth is that while the control has
`getWaypoints`, `setWaypoints` as well as `spliceWaypoints`, they are really just shortcuts that call
the control's plan's methods with the same names. It is the plan's responsibility to hold the list of
waypoints, and the control will query it when needed.

Ok, we now have a `ReversablePlan`, but how do we use it in the routing control? This is done with yet
another option when creating the control:

```language-javascript
var plan = new ReversablePlan([
        L.latLng(57.74, 11.94),
        L.latLng(57.6792, 11.949)
    ], {
        geocoder: L.Control.Geocoder.nominatim(),
        routeWhileDragging: true
    }),
    control = L.Routing.control({
        routeWhileDragging: true,
        plan: plan
    }).addTo(map1);
```

While this looks pretty straight forward, there are a couple of points to note here:

* We no longer use the `waypoints` option to set the initial waypoints, but rather pass
them as the first argument when creating the plan instance
* The option `geocoder` is passed when creating the plan instance
instance rather than when creating the control
* The option `routeWhileDragging` is passed *both* when creating the plan as well as when
creating the control

Why is this? Well, unless the `plan` option is specified, the control will instantiate its own
plan instance, and when doing so it will _pass the same options that were passed to it_, meaning
the plan will get the same options object that we passed when creating the control. This means that
even though the control itself actually doesn't have a `geocoder` option, you can pass it one,
since the plan *does* have a `geocoder` option, and will get the value we passed in to the control.
On the other hand, when we use a plan we created ourselves, the plan's options are already set,
since it's already created, and we need to pass the options directly to the plan when creating it.

The `waypoints` option is a shortcut that sets the plan's waypoints, but it can also be achieved
by passing the waypoints when creating the plan, so we do that instead.

For full details on available options, methods and events, you can always look up the
[Leaflet Routing Machine API docs]({{site.baseurl}}/api).

<script src="index.js"></script>
