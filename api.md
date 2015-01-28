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
      <li><a href="#l-routing-formatter">L.Routing.Formatter</a></li>
      <li><a href="#l-routing-itinerarybuilder">L.Routing.ItineraryBuilder</a></li>
      <li><a href="#l-routing-localization">L.Routing.Localization</a></li>
      <li><a href="#l-routing-waypoint">L.Routing.Waypoint</a></li>
      <li><a href="#eventobjects">Event Objects</a></li>
    </ul>
  </div>
  <div class="span-5">
    <h4>Interfaces</h4>
    <ul>
      <li><a href="#irouter">IRouter</a></li>
      <li><a href="#iroute">IRoute</a></li>
      <li><a href="#iroutesummary">IRouteSummary</a></li>
      <li><a href="#iinstruction">IInstruction</a></li>
      <li><a href="#igeocoderelement">IGeocoderElement</a></li>
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
`waypoints`            | [`L.Routing.Waypoint`](#l-routing-waypoint)`[]` or `L.LatLng[]` | [] | Initial waypoints for the control
`router`               | [`IRouter`](#irouter) | `new L.Routing.OSRM(options)` | The router to use to calculate routes between waypoints
`plan`                 | [`L.Routing.Plan`](#l-routing-plan) | `new L.Routing.Plan(options.waypoints, options)` | The plan to use to store and edit the route's waypoints
`geocoder`                 | [`IGeocoder`](https://github.com/perliedman/leaflet-control-geocoder#igeocoder) | - | Optional geocoder to use, unless the `plan` option is used
`fitSelectedRoutes`    | `string`/`Boolean`    | `'smart'`       | How the map's view is fitted to a selected route result: `smart` will fit only if no waypoint is within the current view, or if the result covers a very small part of the view; other truthy values will always fit the map, falsy will never fit the map
`routeLine`            | ``Function`           | -               | Function to create the map line when a route is presented on the map, with the signature: `fn(<`[`IRoute`](#iroute)`> route, <`[`LineOptions`](#lineoptions)`> options)`
`autoRoute`            | `Boolean`             | `true`          | If true, route will automatically be calculated every time waypoints change, otherwise `route()` has to be called by the app
`routeWhileDragging`   | `Boolean`             | `false`         | If true, routes will continually be calculated while the user drags waypoints, giving immediate feedback
`routeDragInterval`    | `Number`              | `500`           | The minimum number of milliseconds between route calculations when waypoints are dragged
`waypointMode`         | `String`              | `connect`       | Set to either `connect` (waypoints are connected by a line to the closest point on the calculated route) or `snap` (waypoints are moved to the closest point on the calculated route)
`useZoomParameter`     | `Boolean`             | `false`         | If true, route will be recalculated when the map is zoomed



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
`getWaypoints()`       | [`L.Routing.Waypoint`](#l-routing-waypoint)`[]` | Returns the waypoints of the control's plan
`setWaypoints(<`[`L.Routing.Waypoint`](#l-routing-waypoint)`[]> waypoints \| <L.LatLng[]> latLngs)` | `this` | Sets the waypoints of the control's plan
`spliceWaypoints(<Number> index, <Number> waypointsToRemove, <`[`L.Routing.Waypoint`](#l-routing-waypoint)`? \| L.LatLng?>, ...)` | [`L.Routing.Waypoint`](#l-routing-waypoint)`[]` | Allows adding, removing or replacing waypoints in the control's plan. Syntax is the same as in [Array#splice](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/splice). Returns the array of removed points (if any).
`getPlan()`            | [`L.Routing.Plan`](#l-routing-plan) | Returns the plan instance used by the control
`getRouter()`          | [`IRouter`](#irouter) | Returns the router used by the control
`route()`              | -              | Calculates the route between the current waypoints and presents in the itinerary, displaying the first result on the map

## <a name="l-routing-itinerary"></a> L.Routing.Itinerary

A widget to display itineraries as text in a control. Also serves as the base class for [`L.Routing.Control`](#l-routing-control). Implements [IControl](http://leafletjs.com/reference.html#icontrol).

### Creation

Factory                | Description
-----------------------|-------------------------------------------------------
`L.Routing.itinerary(<`[`ItineraryOptions`](#itineraryoptions)`> options?)` | Instantiates a new itinerary widget with the provided options

### <a name="itineraryoptions"></a> Options

Option                 | Type     | Default             | Description
-----------------------|----------|---------------------|---------------------------------------------------------
`pointMarkerStyle`     | [`Path options`](http://leafletjs.com/reference.html#path-options) | `{radius: 5,color: '#03f',fillColor: 'white',opacity: 1,fillOpacity: 0.7}`| Style for the [CircleMarker](http://leafletjs.com/reference.html#circlemarker)s used when hovering an itinerary instruction
`summaryTemplate`      | `String` | `'<h2>{name}</h2><h3>{distance}, {time}</h3>'` | String template to use for summarizing a route; the template is passed properties `name`, `distance` and `time`, where the latter two has already been processed through `distanceTemplate` and `timeTemplate` respectively
`distanceTemplate`     | `String` | `'{value} {unit}'`  | String template to use for formatting distances as a string; passed properties `value` and `unit`
`timeTemplate`         | `String` | `'{time}'`          | String template to use for formatting times as a string; passed property `time`
`containerClassName`   | `String` | `''`                | Class name to add for the widget's container element
`alternativeClassName` | `String` | `''`                | Class name to add to routing alternatives' elements
`minimizedClassName`   | `String` | `''`                | Class name to add to minimized routing alternatives' elements
`itineraryClassName`   | `String` | `''`                | Class name to add to route itinerary container
`show`                 | `Boolean`| `true`              | Display the itinerary initially; can later be changed with `hide()`and `show()` methods
`formatter`            | [`Formatter`](#l-routing-formatter) | `new L.Routing.Formatter()` | The formatter to use when converting itinerary instructions, distances and times to strings
`itineraryFormatter`   | [`ItineraryBuilder`](#l-routing-itinerarybuilder) | - | Object used to create the DOM structure for the itinerary and its instructions. Default uses a `table` to hold the itinerary

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
`L.Routing.plan(<`[`L.Routing.Waypoint`](#l-routing-waypoint)`[] \| L.LatLng[]> waypoints, <`[`PlanOptions`](#planoptions)`> options?)` | Instantiates a new plan with given waypoint locations and options

### <a name="planoptions"></a> Options

Option                 | Type                | Default       | Description
-----------------------|---------------------|----------------------|---------------------------------------------------------
`geocoder`             | [`IGeocoder`](https://github.com/perliedman/leaflet-control-geocoder#igeocoder) | `-` | The geocoder to use (both address lookup and reverse geocoding when dragging waypoints)
`addWaypoints`         | `Boolean`           | `true`        | Can new waypoints be added by the user
`draggableWaypoints`   | `Boolean`           | `true`        | Can waypoints be dragged in the map
`dragStyles`           | [`Path options`](http://leafletjs.com/reference.html#path-options)`[]` | `[{color: 'black', opacity: 0.15, weight: 7}, {color: 'white', opacity: 0.8, weight: 4}, {color: 'orange', opacity: 1, weight: 2, dashArray: '7,12'}]`| Styles used for the line or lines drawn when dragging a waypoint
`maxGeocoderTolerance` | `Number`            | `200`         | Maximum distance in meters from a reverse geocoding result to a waypoint, to consider the address valid
`geocoderPlaceholder`  | `Function`          | -             | Function to generate placeholder text for a waypoint geocoder: `placeholder(<Number> waypointIndex, <Number> numberWaypoints)`; by default, gives text "Start" for first waypoint, "End" for last, and "Via x" in between
`geocodersClassName`   | `String`            | `''`          | HTML classname to assign to geocoders container
`geocoderClass`        | `String`            | `''`          | HTML classname to assign to individual geocoder inputs
`waypointNameFallback` | `Function`          | -             | When a waypoint's name can't be reverse geocoded, this function will be called to generate a name. Default will give a name based on the waypoint's latitude and longitude.
`createGeocoder`       | `Function`          | -             | Create a geocoder for a waypoint; should return an [`IGeocoderElement`](#igeocoderelement)
`addButtonClassName`   | `String`            | `''`          | HTML classname to assign to the add waypoint button
`createMarker`         | `Function`          | -             | Creates a marker to use for a waypoint. The function should have the signature `createMarker(<Number> i, <[`L.Routing.Waypoint`](#l-routing-waypoint)`> waypoint, <Number> n)`, where `i` is the waypoint's index, `waypoint` is the waypoint itself, and `n` is the total number of waypoints in the plan; if return value is falsy, no marker is added for the waypoint

### Events

Event         | Data           | Description
--------------|----------------|---------------------------------------------------------------
`waypointschanged`  | [`RoutingEvent`](#routingevent) | Fired when one or more waypoints change (added, deleted, moved)
`waypointsspliced`  | [`WaypointsSplicedEvent`](#waypointssplicedevent) | Also fired when waypoints changed, but includes more finegrained details on actual changes, like a call to `Array.splice`


### Methods

Method                 | Returns        | Description
-----------------------|----------------|-----------------------------------------------------------------
`isReady()`            | `Boolean`      | Returns `true` if the plan is ready to be routed, meaning it has at least a start and end waypoint, and both have coordinates
`getWaypoints()`       | [`L.Routing.Waypoint`](#l-routing-waypoint)`[]` | Returns the plan's waypoints
`setWaypoints(<`[`L.Routing.Waypoint`](#l-routing-waypoint)`[]> waypoints \| <L.LatLng[]> latLngs)` | `this` | Sets the plan's waypoints
`spliceWaypoints(<Number> index, <Number> waypointsToRemove, <`[`L.Routing.Waypoint`](#l-routing-waypoint)`? \| L.LatLng?>, ...)` | [`L.Routing.Waypoint`](#l-routing-waypoint)`[]` | Allows adding, removing or replacing the plan's waypoints. Syntax is the same as in [Array#splice](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/splice). Returns the array of removed points (if any).
`createGeocoders()`    | `HTMLElement`  | Creates and returns an HTML widget with geocoder input fields for editing waypoints by address


## <a name="l-routing-line"></a> L.Routing.Line

Displays a route on the map, and allows adding new waypoints by dragging the line. Extends [LayerGroup](http://leafletjs.com/reference.html#layergroup).

### Creation

Factory                | Description
-----------------------|-------------------------------------------------------
`L.Routing.line(<`[`IRoute`](#iroute)`> route, <`[`LineOptions`](#lineoptions)`> options?)` | Instantiates a new line for the given route and provided options

### <a name="lineoptions"></a> Options

Option                 | Type     | Default             | Description
-----------------------|----------|---------------------|---------------------------------------------------------
`styles`           | [`Path options`](http://leafletjs.com/reference.html#path-options)`[]` | `[{color: 'black', opacity: 0.15, weight: 9}, {color: 'white', opacity: 0.8, weight: 6}, {color: 'red', opacity: 1, weight: 2}]`| Styles used for the line or lines drawn to represent the line
`addWaypoints`         | `Boolean`| `true`              | Can new waypoints be added by dragging the line
`missingRouteStyles`   | [`Path options`](http://leafletjs.com/reference.html#path-options)`[]` | `[{color: 'black', opacity: 0.15, weight: 7},{color: 'white', opacity: 0.6, weight: 4},{color: 'gray', opacity: 0.8, weight: 2, dashArray: '7,12'}]` | Styles used for the line or lines drawn to connect waypoints to the closest point on the calculated route (the non-routable part)


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
`timeout`              | `Number` | 30000               | Number of milliseconds before a route calculation times out, returning an error to the routing callback

### Methods

Method                 | Returns         | Description
-----------------------|-----------------|-----------------------------------------------------------------
`route(<`[`L.Routing.Waypoint`](#l-routing-waypoint)`[]> waypoints, <Function> callback, <Object> context?), <`[`RoutingOptions`](#routingoptions)`> options)` | - | attempt to route through the provided waypoints, where each waypoint is an `L.Routing.Waypoint`. Calls `callback(<`[`IError`](#ierror)`> err?, <`[`IRoute`](#iroute)`[]> routes?)` in the provided `context` when done or if an error is encountered
`buildRouteUrl(<`[`L.Routing.Waypoint`](#l-routing-waypoint)`[]> waypoints, <`[`RoutingOptions`](#routingoptions)`> options)` | `String` | Returns the URL to calculate the route between the given waypoints; typically used for downloading the route in some other file format


## <a name="routingoptions"></a> RoutingOptions

Option                 | Type      | Default             | Description
-----------------------|-----------|---------------------|------------------------------------------------------
`z`                    | `Number`  | -                   | Current zoom level when the request was made
`allowUTurns`          | `Boolean` | -                   | If U-turns are allowed in this route (migh only be applicable for OSRM backend)
`geometryOnly`         | `Boolean` | `false`             | If true, try to save bandwidth by just giving the route geometry; also, multiple results are not required (typically used for route preview when dragging a waypoint)
`fileFormat`           | `String`  | -                   | Fileformat to return


## <a name="l-routing-formatter"></a> L.Routing.Formatter

Implements functions to convert distances and times to strings, as well as converting an [`IInstruction`](#iinstruction) to a string. Override or implement your own if you need to customize formatting.

### Creation

Constructor                | Description
-----------------------|-------------------------------------------------------
`L.Routing.Formatter(<`[`FormatterOptions`](#formatteroptions)`> options?)` | Instantiates a new formatter with the provided options

### <a name="formatteroptions"></a> Options

Option                 | Type     | Default             | Description
-----------------------|----------|---------------------|---------------------------------------------------------
`language`             | `String` | `'en'`              | Language to use from [`L.Routing.Localization`](#l-routing-localization)
`units`                | `String` | `'metric'`          | Units to use; `'metric'` or `'imperial'`
`roundingSensitivity`  | `Number` | `1`                 | How much rounding should be applied to distances; higher means more rounded, lower more accurate
`unitNames`            | `Object` | `{meters: 'm',kilometers: 'km',yards: 'yd',miles: 'mi',hours: 'h',minutes: 'mín',seconds: 's'}` | Hash of unit names to use

### Methods

Method                 | Returns         | Description
-----------------------|-----------------|-----------------------------------------------------------------
`formatDistance(<Number> d)` | `String`  | Formats a distance given in meters to a string with suitable precision and unit
`formatTime(<Number> t) | `String`       | Formats a time duration, given in seconds, to a string with suitable precision and unit
`formatInstruction(<`[`IInstruction`](#iinstruction)`> instr)` | String | Formats an instruction to a human readable text

## <a name="iitinerarybuilder"></a>ItineraryBuilder

Creates the DOM structure for an itinerary. Subclass or reimplement to create your own itinerary structure.

### Methods

Method                                | Returns        | Description
--------------------------------------|----------------|-----------------------------------------------------
`createContainer(<String> className)` | `HTMLElement`  | Create the container in which the itinerary will be put; default will create a `table`
`createStepsContainer(<HTMLElement> container) | `HTMLElement` | Create the container for the instructions/steps; default will create a `tbody`
`createStep(<String> text, <String> distance, <HTMLElement> steps) | `HTMLElement` | Creates a DOM element for an instruction, with the provided text and distance (already formatted as string with unit); default will create a `tr`


## <a name="l-routing-localization"></a>L.Routing.Localization

Contains localization for strings used by the control. The object is a simple hash with language code as key.

## <a name="l-routing-waypoint"></a> L.Routing.Waypoint

property      | type         | description
--------------|-------------|-----------------------------------
`latLng`      | `L.LatLng`  | geographic location of the waypoint
`name`        | `String?`   | name of the waypoint, typically an address; optional and possibly `null` or `undefined`


## <a name="eventobjects"></a> Event Objects

### <a name="routingevent"></a>RoutingEvent

property      | type        | description
--------------|------------|-----------------------------------
waypoints     |[`L.Routing.Waypoint`](#l-routing-waypoint)`[]`  | The waypoints of the related route


### <a name="routingresultevent"></a> RoutingResultEvent

property      | type        | description
--------------|------------|-----------------------------------
waypoints     |[`L.Routing.Waypoint`](#l-routing-waypoint)`[]`  | The waypoints of the related route
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
`added`       | [`L.Routing.Waypoint`](#l-routing-waypoint)`[]` | Added waypoints


### <a name="linetouchedevent"></a> LineTouchedEvent

property      | type        | description
--------------|-------------|-----------------------------------
`afterIndex`  | `Number`    | Index of the waypoint closest before the location where the line was touched
`latlng`      | `Number`    | Location where the line was touched

## <a name="irouter"></a> IRouter

### Methods

Method                 | Returns        | Description
-----------------------|----------------|-----------------------------------------------------------------
`route(<`[`L.Routing.Waypoint`](#l-routing-waypoint)`[]> waypoints, <Function> callback, <Object> context?), <`[`RoutingOptions`](#routingoptions)`> options)` | - | attempt to route through the provided waypoints, where each waypoint is an `L.Routing.Waypoint`. Calls `callback(<`[`IError`](#ierror)`> err?, <`[`IRoute`](#iroute)`[]> routes?)` in the provided `context` when done or if an error is encountered


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

## <a name="igeocoderelement"></a>IGeocoderElement

property      | type          | description
--------------|---------------|------------------------------------
`container`   | `HTMLElement` | The main element of the geocoder, that is added to the control
`input`       | `HTMLElement` | Input element where the geocoder's `value` can be get and set
`closeButton` | `HTMLElement` | Optional element which, when clicked, removes the corresponding waypoint

## <a name="ierror"></a> IError

### Properties

* `status`: status/error code (possibly technical); string or number
* `message`: human-readable error message
