import Formatter from '../src/formatter';

describe('L.Routing.Formatter', () => {
	describe('.round', () => {
		it('rounds 0 < x < 5 to multiple of 0.5', () => {
			const formatter = new Formatter();
			expect(formatter.round(1)).toBe(1);
			expect(formatter.round(1.4)).toBe(1.5);
			expect(formatter.round(1.75)).toBe(2);
		});
		it('rounds 5 < x < 10 to nearest integer', () => {
			const formatter = new Formatter();
			expect(formatter.round(7)).toBe(7);
			expect(formatter.round(9.4)).toBe(9);
			expect(formatter.round(9.8)).toBe(10);
		});
		it('rounds 10 < x < 50 values to multiples of 5', () => {
			const formatter = new Formatter();
			expect(formatter.round(11.5)).toBe(10);
			expect(formatter.round(14)).toBe(15);
			expect(formatter.round(42)).toBe(40);
			expect(formatter.round(43)).toBe(45);
		});
		it('rounds 50 < x < 100 to multiples of 10', () => {
			const formatter = new Formatter();
			expect(formatter.round(72)).toBe(70);
			expect(formatter.round(76)).toBe(80);
			expect(formatter.round(97.6)).toBe(100);
		});
		it('rounds 100 < x < 150 to multiples of 50', () => {
			const formatter = new Formatter();
			expect(formatter.round(105)).toBe(100);
			expect(formatter.round(125)).toBe(150);
		});
		it('rounds large values to multiples of 100', () => {
			const formatter = new Formatter();
			expect(formatter.round(686)).toBe(700);
			expect(formatter.round(860)).toBe(900);
		});
		it('considers rounding sensitivity', () => {
			const formatter = new Formatter({ roundingSensitivity: 5 });
			expect(formatter.round(24)).toBe(24);
			expect(formatter.round(52)).toBe(50);
		});
	});

	describe('.formatDistance', () => {
		it('rounds long distances reasonably', () => {
			const formatter = new Formatter({
				distanceTemplate: '{value}'
			});
			expect(parseInt(formatter.formatDistance(22000), 10)).toBe(20);
			expect(parseInt(formatter.formatDistance(24000), 10)).toBe(25);
			expect(parseInt(formatter.formatDistance(86000), 10)).toBe(90);
		});
		it('formats imperial units properly', () => {
			const formatter = new Formatter({
				distanceTemplate: '{value}',
				units: 'imperial'
			});
			expect(parseInt(formatter.formatDistance(800), 10)).toBe(900);
			expect(parseInt(formatter.formatDistance(22000), 10)).toBe(15);
			expect(parseInt(formatter.formatDistance(24500), 10)).toBe(15);
			expect(parseInt(formatter.formatDistance(86000), 10)).toBe(55);
		});
	});

	describe('.formatTime', () => {
		it('rounds whole minutes without seconds', () => {
			const formatter = new Formatter();
			expect(formatter.formatTime(240)).toBe('4 min');
		})
		it('rounds just under five minutes to five minutes without seconds', () => {
			const formatter = new Formatter();
			expect(formatter.formatTime(299.10000000005)).toBe('5 min');
		})
	});
});
