export PATH := node_modules/.bin:$(PATH)

build: dist/leaflet-routing-machine.min.js
	cp css/*.css dist

dist/leaflet-routing-machine.js:	src/*.js
	mkdir -p $(dir $@)
	cat src/*.js >$@

dist/leaflet-routing-machine.min.js:	dist/leaflet-routing-machine.js
	uglifyjs dist/leaflet-routing-machine.js >$@
