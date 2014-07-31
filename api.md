---
layout: api
title: API
---

# Leaflet Routing Machine API

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

Combining the other classes into a full routing user interface. The main class of the plugin. Extends [L.Routing.Itinerary](#l-routing-itinerary).

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
`L.Routing.control(<`[`RoutingControlOptions`](#routingcontroloptions)`> options?)` | Instantiates a new routing control with the provided options

### <a name="routingcontroloptions"></a> Options

Provides these options, in addition to the options of [`L.Routing.Itinerary`](#itineraryoptions).

Option                 | Type                | Default       | Description
-----------------------|---------------------|----------------------|---------------------------------------------------------
`waypoints`              | [`IWaypoint`](#iwaypoint)`[]` or `L.LatLng[]` | [] | Initial waypoints for the control
`router`                 | [`IRouter`](#irouter) | `new L.Routing.OSRM()` | The router to use to calculate routes between waypoints
`plan`                   | [`L.Routing.Plan`](#plan) | `new L.Routing.Plan()` | The plan to use to store and edit the route's waypoints
`fitSelectedRoutes`      | `Boolean`             | `true`          | Automatically fit the map view to a route when it is selected

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

A widget to display itineraries as text in a control. Also serves as the base class for [`L.Routing.Control`](#l-routing-control).

### Creation

Factory                | Description
-----------------------|-------------------------------------------------------
`L.Routing.itinerary(<`[`ItineraryOptions`](#itineraryoptions)`> options?)` | Instantiates a new itinerary widget with the provided options

### <a name="itineraryoptions"></a> Options

Option                 | Type                | Default       | Description
-----------------------|---------------------|----------------------|---------------------------------------------------------
`units`              | `String` | `'metric'` | Units to use; `'metric'` or `'imperial'`
`pointMarkerStyle`   | [`Path options`](http://leafletjs.com/reference.html#path-options) | `{radius: 5,color: '#03f',fillColor: 'white',opacity: 1,fillOpacity: 0.7}`| Style for the [CircleMarker](http://leafletjs.com/reference.html#circlemarker)s used when hovering an itinerary instruction

### Events

Event         | Data           | Description
--------------|----------------|---------------------------------------------------------------
`routeselected`  | [`RouteSelectedEvent`](#routeselectedevent) | Fires when a routing alternative is selected and its itinerary is displayed

### Methods

Method                 | Returns        | Description
-----------------------|----------------|-----------------------------------------------------------------
`setAlternatives(<`[`IRoute`](#iroute)`[]> alternatives)`    | - | Sets the routing alternatives to display itineraries for

## L.Routing.Line

Displays a route on the map, and allows moving waypoints, as well as adding new waypoints.

## L.Routing.OSRM

Handles communication with the OSRM backend, building the request and parsing the response. Implements [IRouter](#irouter).

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


## <a name="irouter"></a> IRouter

### Methods

Method                 | Returns        | Description
-----------------------|----------------|-----------------------------------------------------------------
`route(<`[`IWaypoint`](#waypoint)`[]> waypoints, <Function> callback, <Object> context?)` | - | attempt to route through the provided waypoints, where each waypoint is an `IWaypoint`. Calls `callback(<`[`IError`](#ierror)`> err?, <`[`IRoute`](#iroute)`[]> routes?)` in the provided `context` when done or if an error is encountered

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

* `distance` (Number) - distance in meters for this segment
* `time` (Number) - estimated time in seconds for this segment

Combined with either:

* `text` (string) - explicit instruction text

or:

* `type` (string) - one of the enumerated instruction types (see below)
* `road` (String) - name of road for this segment, if available
* `direction` (String) - aproximate compass direction: N, NE, E, SE, S, SW, W, NW
* `exit` (Integer, optional) - for roundabouts, designates the number of the exit to take

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
