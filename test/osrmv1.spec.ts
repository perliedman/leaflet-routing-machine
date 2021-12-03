import OSRMv1 from '../src/osrm-v1';
import Waypoint from '../src/waypoint';

describe('L.Routing.OSRMv1', () => {
    describe('#route', () => {
        const waypoints = [
            new Waypoint([57.73, 11.94]),
            new Waypoint([57.7, 11.9])
        ];
        it.skip('returns correct waypoints', async () => {
            const router = new OSRMv1();
            const routes = await router.route(waypoints);
            waypoints.forEach((wp, i) => {
                const returnedWp = routes[0].waypoints[i];
                expect(Math.abs(returnedWp.latLng!.lat - wp.latLng!.lat)).toBeLessThan(0.1);
                expect(Math.abs(returnedWp.latLng!.lng - wp.latLng!.lng)).toBeLessThan(0.1);
            });
        });
    });
});
