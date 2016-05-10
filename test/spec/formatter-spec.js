describe('L.Routing.Formatter', function() {
	describe('._round', function() {
		it('rounds 0 < x < 5 to multiple of 0.5', function() {
			var p = new L.Routing.Formatter(undefined);
			expect(p._round(1)).toBe(1);
			expect(p._round(1.4)).toBe(1.5);
			expect(p._round(1.75)).toBe(2);
		});
		it('rounds 5 < x < 10 to nearest integer', function() {
			var p = new L.Routing.Formatter(undefined);
			expect(p._round(7)).toBe(7);
			expect(p._round(9.4)).toBe(9);
			expect(p._round(9.8)).toBe(10);
		});
		it('rounds 10 < x < 50 values to multiples of 5', function() {
			var p = new L.Routing.Formatter(undefined);
			expect(p._round(11.5)).toBe(10);
			expect(p._round(14)).toBe(15);
			expect(p._round(42)).toBe(40);
			expect(p._round(43)).toBe(45);
		});
		it('rounds 50 < x < 100 to multiples of 10', function() {
			var p = new L.Routing.Formatter(undefined);
			expect(p._round(72)).toBe(70);
			expect(p._round(76)).toBe(80);
			expect(p._round(97.6)).toBe(100);
		});
		it('rounds 100 < x < 150 to multiples of 50', function() {
			var p = new L.Routing.Formatter(undefined);
			expect(p._round(105)).toBe(100);
			expect(p._round(125)).toBe(150);
		});
		it('rounds large values to multiples of 100', function() {
			var p = new L.Routing.Formatter(undefined);
			expect(p._round(686)).toBe(700);
			expect(p._round(860)).toBe(900);
		});
		it('considers rounding sensitivity', function() {
			var p = new L.Routing.Formatter({roundingSensitivity: 5});
			expect(p._round(24)).toBe(24);
			expect(p._round(52)).toBe(50);
		});
	});

	describe('.formatDistance', function() {
		it('rounds long distances reasonably', function() {
			var p = new L.Routing.Formatter({
				distanceTemplate: '{value}'
			});
			expect(parseInt(p.formatDistance(22000), 10)).toBe(20);
			expect(parseInt(p.formatDistance(24000), 10)).toBe(25);
			expect(parseInt(p.formatDistance(86000), 10)).toBe(90);
		});
		it('formats imperial units properly', function() {
			var p = new L.Routing.Formatter({
				distanceTemplate: '{value}',
				units: 'imperial'
			});
			expect(parseInt(p.formatDistance(800), 10)).toBe(900);
			expect(parseInt(p.formatDistance(22000), 10)).toBe(15);
			expect(parseInt(p.formatDistance(24500), 10)).toBe(15);
			expect(parseInt(p.formatDistance(86000), 10)).toBe(55);
		});
	});

	describe('.formatTime', function() {
		it('rounds whole minutes without seconds', function() {
			var p = new L.Routing.Formatter();
			expect(p.formatTime(240)).toBe('4 min');
		})
		it('rounds just under five minutes to five minutes without seconds', function() {
			var p = new L.Routing.Formatter();
			expect(p.formatTime(299.10000000005)).toBe('5 min');
		})
	});
});
