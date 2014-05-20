export PATH := node_modules/.bin:$(PATH)

build: dist/leaflet-routing-machine.min.js
	cp css/*.css dist

dist/leaflet-routing-machine.js:	src/*.js
	mkdir -p $(dir $@)
	cat src/pre.js src/L.Routing.Autocomplete.js src/L.Routing.OSRM.js src/L.Routing.Line.js src/L.Routing.Itinerary.js src/L.Routing.Plan.js src/L.Routing.Control.js src/post.js >$@

dist/leaflet-routing-machine.min.js:	dist/leaflet-routing-machine.js
	uglifyjs dist/leaflet-routing-machine.js >$@
