describe('L.Routing.OSRMv1', function() {
    describe('#route', function() {
        var waypoints = [
            new L.Routing.Waypoint([57.73, 11.94]),
            new L.Routing.Waypoint([57.7, 11.9])
        ];
        it('returns correct waypoints', function(done) {
            var router = new L.Routing.OSRMv1();
            router.route(waypoints, function(err, routes) {
                if (err) {
                    return done(err);
                }

                if (!routes.length) {
                    return done('No routes :(');
                }

                waypoints.forEach(function(wp, i) {
                    var returnedWp = routes[0].waypoints[i];
                    expect(Math.abs(returnedWp.latLng.lat - wp.latLng.lat)).to.be.lessThan(0.1);
                    expect(Math.abs(returnedWp.latLng.lng - wp.latLng.lng)).to.be.lessThan(0.1);
                });

                done();
            });
        });
    });
});
