---
layout: api
title: API
---

# Leaflet Routing Machine API

----

<div id="toc" class="clearfix">
  <div class="span-5 colborder">
    <h4>Main classes</h4>
    <ul>
      <li><a href="#l-routing-control">L.Routing.Control</a></li>
      <li><a href="#l-routing-itinerary">L.Routing.Itinerary</a></li>
      <li><a href="#l-routing-plan">L.Routing.Plan</a></li>
      <li><a href="#l-routing-line">L.Routing.Line</a></li>
      <li><a href="#l-routing-osrm">L.Routing.OSRM</a></li>
      <li><a href="#eventobjects">Event Objects</a></li>
    </ul>
  </div>
  <div class="span-5">
    <h4>Interfaces</h4>
    <ul>
      <li><a href="#irouter">IRouter</a></li>
      <li><a href="#iroute">IRoute</a></li>
      <li><a href="#iroutesummary">IRouteSummary</a></li>
      <li><a href="#iwaypoint">IWaypoint</a></li>
      <li><a href="#iinstruction">IInstruction</a></li>
      <li><a href="#ierror">IError</a></li>
    </ul>
  </div>
</div>

## <a name="l-routing-control"></a>L.Routing.Control

Combining the other classes into a full routing user interface. The main class of the plugin. Extends [L.Routing.Itinerary](#l-routing-itinerary) and implements [IControl](http://leafletjs.com/reference.html#icontrol).

### Usage example

```javascript
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

### Creation

Factory                | Description
-----------------------|-------------------------------------------------------
`L.Routing.control(<`[`RoutingControlOptions`](#routingcontroloptions)`> options?)` | Instantiates a new routing control with the provided options; unless specific `router` and/or `plan` instances are provided, `options` are also passed to their constructors

### <a name="routingcontroloptions"></a> Options

Provides these options, in addition to the options of [`L.Routing.Itinerary`](#itineraryoptions).

Option                 | Type                | Default       | Description
-----------------------|---------------------|----------------------|---------------------------------------------------------
`waypoints`            | [`IWaypoint`](#iwaypoint)`[]` or `L.LatLng[]` | [] | Initial waypoints for the control
`router`               | [`IRouter`](#irouter) | `new L.Routing.OSRM(options)` | The router to use to calculate routes between waypoints
`plan`                 | [`L.Routing.Plan`](#l-routing-plan) | `new L.Routing.Plan(options.waypoints, options)` | The plan to use to store and edit the route's waypoints
`geocoder`                 | [`IGeocoder`](https://github.com/perliedman/leaflet-control-geocoder#igeocoder) | - | Optional geocoder to use, unless the `plan` option is used
`fitSelectedRoutes`    | `Boolean`             | `true`          | Automatically fit the map view to a route when it is selected

### Events

Fires these events, in addition the the events used by [`L.Routing.Itinerary`](#l-routing-itinerary).

Event         | Data           | Description
--------------|----------------|---------------------------------------------------------------
`routingstart`  | [`RoutingEvent`](#routingevent) | Fires when the control starts calculating a route; followed by either a `routesfound` or `routingerror` event
`routesfound` | [`RoutingResultEvent`](#routingresultevent) | One or more routes where found
`routingerror` | [`RoutingErrorEvent`](#routingerrorevent) | An error occured while calculating the route between waypoints

### Methods

Method                 | Returns        | Description
-----------------------|----------------|-----------------------------------------------------------------
`getWaypoints()`       | [`IWaypoint`](#iwaypoint)`[]` | Returns the waypoints of the control's plan
`setWaypoints(<`[`IWaypoint`](#iwaypoint)`[]> waypoints \| <L.LatLng[]> latLngs)` | `this` | Sets the waypoints of the control's plan
`spliceWaypoints(<Number> index, <Number> waypointsToRemove, <`[`IWaypoint`](#iwaypoint)`? \| L.LatLng?>, ...)` | [`IWaypoint`](#iwaypoint)`[]` | Allows adding, removing or replacing waypoints in the control's plan. Syntax is the same as in [Array#splice](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/splice). Returns the array of removed points (if any).
`getPlan()`            | [`L.Routing.Plan`](#l-routing-plan) | Returns the plan instance used by the control

## <a name="l-routing-itinerary"></a> L.Routing.Itinerary

A widget to display itineraries as text in a control. Also serves as the base class for [`L.Routing.Control`](#l-routing-control). Implements [IControl](http://leafletjs.com/reference.html#icontrol).

### Creation

Factory                | Description
-----------------------|-------------------------------------------------------
`L.Routing.itinerary(<`[`ItineraryOptions`](#itineraryoptions)`> options?)` | Instantiates a new itinerary widget with the provided options

### <a name="itineraryoptions"></a> Options

Option                 | Type     | Default             | Description
-----------------------|----------|---------------------|---------------------------------------------------------
`units`                | `String` | `'metric'`          | Units to use; `'metric'` or `'imperial'`
`pointMarkerStyle`     | [`Path options`](http://leafletjs.com/reference.html#path-options) | `{radius: 5,color: '#03f',fillColor: 'white',opacity: 1,fillOpacity: 0.7}`| Style for the [CircleMarker](http://leafletjs.com/reference.html#circlemarker)s used when hovering an itinerary instruction
`summaryTemplate`      | `String` | `'<h2>{name}</h2><h3>{distance}, {time}</h3>'` | String template to use for summarizing a route; the template is passed properties `name`, `distance` and `time`, where the latter two has already been processed through `distanceTemplate` and `timeTemplate` respectively
`distanceTemplate`     | `String` | `'{value} {unit}'`  | String template to use for formatting distances as a string; passed properties `value` and `unit`
`timeTemplate`         | `String` | `'{time}'`          | String template to use for formatting times as a string; passed property `time`
`containerClassName`   | `String` | `''`                | Class name to add for the widget's container element
`alternativeClassName` | `String` | `''`                | Class name to add to routing alternatives' elements
`minimizedClassName`   | `String` | `''`                | Class name to add to minimized routing alternatives' elements
`itineraryClassName`   | `String` | `''`                | Class name to add to route itinerary container
`roundingSensitivity`  | `Number` | `1`                 | How much rounding should be applied to distances; higher means more rounded, lower more accurate
`show`                 | `Boolean`| `true`              | Display the itinerary initially; can later be changed with `hide()`and `show()` methods

### Events

Event         | Data           | Description
--------------|----------------|---------------------------------------------------------------
`routeselected`  | [`RouteSelectedEvent`](#routeselectedevent) | Fires when a routing alternative is selected and its itinerary is displayed

### Methods

Method                 | Returns        | Description
-----------------------|----------------|-----------------------------------------------------------------
`setAlternatives(<`[`IRoute`](#iroute)`[]> alternatives)`    | `this` | Sets the routing alternatives to display itineraries for
`hide()`               | `this`         | Hides the itinerary control
`show()`               | `this`         | Shows the itinerary control


## <a name="l-routing-plan"></a> L.Routing.Plan

User interface to edit the plan for a route (an ordered list of waypoints). Implements [ILayer](http://leafletjs.com/reference.html#ilayer).

### Creation

Factory                | Description
-----------------------|-------------------------------------------------------
`L.Routing.plan(<`[`IWaypoint`](#iwaypoint)`[] \| L.LatLng[]> waypoints, <`[`PlanOptions`](#planoptions)`> options?)` | Instantiates a new plan with given waypoint locations and options

### <a name="planoptions"></a> Options

Option                 | Type                | Default       | Description
-----------------------|---------------------|----------------------|---------------------------------------------------------
`geocoder`             | [`IGeocoder`](https://github.com/perliedman/leaflet-control-geocoder#igeocoder) | `-` | The geocoder to use (both address lookup and reverse geocoding when dragging waypoints)
`waypointIcon`         | `L.Icon \| Function` | `L.Icon.Default` | Icon to use for waypoints, or a function that returns an icon, on the form: `icon(<Number> waypointIndex, <Number> numberWaypoints)`
`addWaypoints`         | `Boolean`           | `true`        | Can new waypoints be added by the user
`draggableWaypoints`   | `Boolean`           | `true`        | Can waypoints be dragged in the map
`dragStyles`           | [`Path options`](http://leafletjs.com/reference.html#path-options)`[]` | `[{color: 'black', opacity: 0.15, weight: 7}, {color: 'white', opacity: 0.8, weight: 4}, {color: 'orange', opacity: 1, weight: 2, dashArray: '7,12'}]`| Styles used for the line or lines drawn when dragging a waypoint
`maxGeocoderTolerance` | `Number`            | `200`         | Maximum distance in meters from a reverse geocoding result to a waypoint, to consider the address valid
`geocoderPlaceholder`  | `Function`          | -             | Function to generate placeholder text for a waypoint geocoder: `placeholder(<Number> waypointIndex, <Number> numberWaypoints)`; by default, gives text "Start" for first waypoint, "End" for last, and "Via x" in between
`geocodersClassName`   | `String`            | `''`          | HTML classname to assign to geocoders container
`geocoderClass`        | `String`            | `''`          | HTML classname to assign to individual geocoder inputs

### Events

Event         | Data           | Description
--------------|----------------|---------------------------------------------------------------
`waypointschanged`  | [`RoutingEvent`](#routingevent) | Fired when one or more waypoints change (added, deleted, moved)
`waypointsspliced`  | [`WaypointsSplicedEvent`](#waypointssplicedevent) | Also fired when waypoints changed, but includes more finegrained details on actual changes, like a call to `Array.splice`


### Methods

Method                 | Returns        | Description
-----------------------|----------------|-----------------------------------------------------------------
`isReady()`            | `Boolean`      | Returns `true` if the plan is ready to be routed, meaning it has at least a start and end waypoint, and both have coordinates
`getWaypoints()`       | [`IWaypoint`](#iwaypoint)`[]` | Returns the plan's waypoints
`setWaypoints(<`[`IWaypoint`](#iwaypoint)`[]> waypoints \| <L.LatLng[]> latLngs)` | `this` | Sets the plan's waypoints
`spliceWaypoints(<Number> index, <Number> waypointsToRemove, <`[`IWaypoint`](#iwaypoint)`? \| L.LatLng?>, ...)` | [`IWaypoint`](#iwaypoint)`[]` | Allows adding, removing or replacing the plan's waypoints. Syntax is the same as in [Array#splice](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/splice). Returns the array of removed points (if any).
`createGeocoders()`    | `HTMLElement`  | Creates and returns an HTML widget with geocoder input fields for editing waypoints by address


## <a name="l-routing-line"></a> L.Routing.Line

Displays a route on the map, and allows adding new waypoints by dragging the line. Implements [ILayer](http://leafletjs.com/reference.html#ilayer).

### Creation

Factory                | Description
-----------------------|-------------------------------------------------------
`L.Routing.line(<`[`IRoute`](#iroute)`> route, <`[`LineOptions`](#lineoptions)`> options?)` | Instantiates a new line for the given route and provided options

### <a name="lineoptions"></a> Options

Option                 | Type     | Default             | Description
-----------------------|----------|---------------------|---------------------------------------------------------
`styles`           | [`Path options`](http://leafletjs.com/reference.html#path-options)`[]` | `[{color: 'black', opacity: 0.15, weight: 7}, {color: 'white', opacity: 0.8, weight: 4}, {color: 'orange', opacity: 1, weight: 2}]`| Styles used for the line or lines drawn to represent the line
`addWaypoints`         | `Boolean`| `true`              | Can new waypoints be added by dragging the line

### Events

Event         | Data           | Description
--------------|----------------|---------------------------------------------------------------
`linetouched` | [`LineTouchedEvent`](#linetouchedevent) | Fires when the line is touched (tapped or clicked)

### Methods

Method                 | Returns         | Description
-----------------------|-----------------|-----------------------------------------------------------------
`getBounds()`          | `L.LatLngBounds`| Returns the bounds of the line

## <a name="l-routing-osrm"></a> L.Routing.OSRM

Handles communication with the OSRM backend, building the request and parsing the response. Implements [IRouter](#irouter).

See [OSRM Server API](https://github.com/Project-OSRM/osrm-backend/wiki/Server-api) for the specification this implementation
is built on.

### Creation

Factory                | Description
-----------------------|-------------------------------------------------------
`L.Routing.osrm(<`[`OSRMOptions`](#osrmoptions)`> options?)` | Instantiates a new router with the provided options

### <a name="osrmoptions"></a> Options

Option                 | Type     | Default             | Description
-----------------------|----------|---------------------|---------------------------------------------------------
`serviceUrl`           | `String` | `//router.project-osrm.org/viaroute` | Router service URL

### Methods

Method                 | Returns         | Description
-----------------------|-----------------|-----------------------------------------------------------------
`route(<`[`IWaypoint`](#iwaypoint)`[]> waypoints, <Function> callback, <Object> context?)` | - | attempt to route through the provided waypoints, where each waypoint is an `IWaypoint`. Calls `callback(<`[`IError`](#ierror)`> err?, <`[`IRoute`](#iroute)`[]> routes?)` in the provided `context` when done or if an error is encountered


## <a name="eventobjects"></a> Event Objects

### <a name="routingevent"></a>RoutingEvent

property      | type        | description
--------------|------------|-----------------------------------
waypoints     |[`IWaypoint`](#iwaypoint)`[]`  | The waypoints of the related route


### <a name="routingresultevent"></a> RoutingResultEvent

property      | type        | description
--------------|------------|-----------------------------------
waypoints     |[`IWaypoint`](#iwaypoint)`[]`  | The waypoints of the related route
routes        |[`IRoute`](#iroute)`[]`        | The routing alternatives


### <a name="routingerrorevent"></a> RoutingErrorEvent

property      | type        | description
--------------|------------|-----------------------------------
error         | [`IError`](#ierror)  | Error object, as passed by the current [`IRouter`](#irouter)


### <a name="routeselectedevent"></a> RouteSelectedEvent

property      | type        | description
--------------|------------|-----------------------------------
route     |[`IRoute`](#iroute)  | The selected route


### <a name="waypointssplicedevent"></a> WaypointsSplicedEvent

property      | type        | description
--------------|-------------|-----------------------------------
`index`       | `Number`    | Index of modification
`nRemoved`    | `Number`    | Number of items removed
`added`       | [`IWaypoint`](#iwaypoint)`[]` | Added waypoints


### <a name="linetouchedevent"></a> LineTouchedEvent

property      | type        | description
--------------|-------------|-----------------------------------
`afterIndex`  | `Number`    | Index of the waypoint closest before the location where the line was touched
`latlng`      | `Number`    | Location where the line was touched

## <a name="irouter"></a> IRouter

### Methods

Method                 | Returns        | Description
-----------------------|----------------|-----------------------------------------------------------------
`route(<`[`IWaypoint`](#iwaypoint)`[]> waypoints, <Function> callback, <Object> context?)` | - | attempt to route through the provided waypoints, where each waypoint is an `IWaypoint`. Calls `callback(<`[`IError`](#ierror)`> err?, <`[`IRoute`](#iroute)`[]> routes?)` in the provided `context` when done or if an error is encountered

## <a name="iwaypoint"></a> IWaypoint

property      | type         | description
--------------|-------------|-----------------------------------
`latLng`      | `L.LatLng`  | geographic location of the waypoint
`name`        | `String?`   | name of the waypoint, typically an address; optional and possibly `null` or `undefined`

## <a name="iroute"></a> IRoute

Describes a route through a number of waypoints.

property      | type            | description
--------------|-----------------|-----------------------------------
`name`        | `String`        | a descriptive name for this route
`summary`     | [`IRouteSummary`](#iroutesummary) | summary of the route
`coordinates` | `L.LatLng`\[\]  | an array of `L.LatLng`s that can be used to visualize the route; the level of detail should be high, since Leaflet will simplify the line appropriately when it is displayed
`waypoints` - | `L.LatLng`\[\]  | the waypoints for this route
`instructions`| [`IInstruction`](#iinstruction)`[]` | instructions for this route

## <a name="iroutesummary"></a>IRouteSummary

property      |type        |description
--------------|------------|-----------------------------------
`totalTime`   |`Number`      |estimated time for the route, in seconds
`totalDistance`|`Number`     |distance for the route, in meters

## <a name="iinstruction"></a>IInstruction

Describes a part of a route's itinerary, such as a turn. Can be of two types: either
a `text` property containing the exact text to be shown to the user, a number of
properties that describe the instruction in an abstract form; the latter can later be
translated to different languages, while explicit text can't.

### Properties

Mandatory:

property      | type        | description
--------------|-------------|--------------------------------------------
`distance`    | `Number`    | distance in meters for this segment
`time`        | `Number`    | estimated time in seconds for this segment

Combined with either:

property      | type        | description
--------------|-------------|--------------------------------------------
`text`        | String      | explicit instruction text

or:

property      | type        | description
--------------|-------------|--------------------------------------------
`type`        | `String`    | one of the enumerated instruction types (see below)
`road`        | `String`    | name of road for this segment, if available
`direction`   | `String`    | aproximate compass direction: N, NE, E, SE, S, SW, W, NW
`exit`        | `Integer`   | for roundabouts, designates the number of the exit to take

### Types

* `Straight`
* `SlightRight`
* `Right`
* `SharpRight`
* `TurnAround`
* `SharpLeft`
* `Left`
* `SlightLeft`
* `WaypointReached`
* `Roundabout`
* `StartAt`
* `DestinationReached`
* `EnterAgainstAllowedDirection`
* `LeaveAgainstAllowedDirection`

## <a name="ierror"></a> IError

### Properties

* `status`: status/error code (possibly technical); string or number
* `message`: human-readable error message
