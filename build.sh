cat src/pre.js src/L.Routing.Autocomplete.js src/L.Routing.OSRM.js src/L.Routing.Line.js src/L.Routing.Itinerary.js src/L.Routing.Plan.js src/L.Routing.Control.js src/post.js >dist/leaflet-routing-machine.js
#uglifyjs dist/leaflet-routing-machine.js >dist/leaflet-routing-machine.min.js
