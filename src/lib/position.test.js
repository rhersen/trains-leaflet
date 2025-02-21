import { describe, expect, it } from 'vitest';
import { interpolate } from './index';

describe('interpolate', () => {
	it('returns empty array', () => {
		expect(interpolate([])).toStrictEqual([]);
	});

	it('handles single position', () => {
		expect(
			interpolate(
				[
					{
						Position: { WGS84: 'POINT (17.938426817990727 59.43823538349574)' },
						TimeStamp: '2025-02-21T10:33:45.000+01:00'
					}
				],
				new Date(2025, 1, 21, 10, 48, 51, 0)
			)
		).toStrictEqual([59.43823538349574, 17.938426817990727]);
	});

	it('interpolates', () => {
		expect(
			interpolate(
				[
					{
						Position: { WGS84: 'POINT (18.0 60.0)' },
						TimeStamp: '2025-02-21T10:49:00.000+01:00'
					},
					{
						Position: { WGS84: 'POINT (17.0 59.0)' },
						TimeStamp: '2025-02-21T10:48:50.000+01:00'
					}
				],
				new Date(2025, 1, 21, 10, 49, 22, 0)
			)
		).toStrictEqual([59.2, 17.2]);
	});

	it('does not extrapolate into the future', () => {
		expect(
			interpolate(
				[
					{
						Position: { WGS84: 'POINT (18.0 60.0)' },
						TimeStamp: '2025-02-21T10:49:00.000+01:00'
					},
					{
						Position: { WGS84: 'POINT (17.0 59.0)' },
						TimeStamp: '2025-02-21T10:48:50.000+01:00'
					}
				],
				new Date(2025, 1, 21, 10, 49, 31, 0)
			)
		).toStrictEqual([60.0, 18.0]);
	});

	it('extrapolates into the past', () => {
		expect(
			interpolate(
				[
					{
						Position: { WGS84: 'POINT (18.0 60.0)' },
						TimeStamp: '2025-02-21T10:49:00.000+01:00'
					},
					{
						Position: { WGS84: 'POINT (17.0 59.0)' },
						TimeStamp: '2025-02-21T10:48:50.000+01:00'
					}
				],
				new Date(2025, 1, 21, 10, 49, 11, 0)
			)
		).toStrictEqual([58.1, 16.1]);
	});

	it('does not crash', () => {
		expect(
			interpolate(
				[
					{
						Position: { WGS84: 'POINT (18.0 60.0)' },
						TimeStamp: '2025-02-21T10:49:00.000+01:00'
					},
					{
						Position: { WGS84: 'POINT (18.0 60.0)' },
						TimeStamp: '2025-02-21T10:48:50.000+01:00'
					}
				],
				new Date(2025, 1, 21, 10, 49, 25, 0)
			)
		).toStrictEqual([60.0, 18.0]);
	});

	it('interpolates around 30 seconds ago', () => {
		expect(
			interpolate(
				[
					{
						Position: { WGS84: 'POINT (18.0 60.0)' },
						TimeStamp: '2025-02-21T10:49:00.000+01:00'
					},
					{
						Position: { WGS84: 'POINT (17.0 59.0)' },
						TimeStamp: '2025-02-21T10:48:50.000+01:00'
					},
					{
						Position: { WGS84: 'POINT (16.8 58.8)' },
						TimeStamp: '2025-02-21T10:48:40.000+01:00'
					}
				],
				new Date(2025, 1, 21, 10, 49, 15, 0)
			)
		).toStrictEqual([58.9, 16.9]);
	});

	it('avoids stopping', () => {
		expect(
			interpolate(
				[
					{
						Position: { WGS84: 'POINT (18.0 60.0)' },
						TimeStamp: '2025-02-21T10:49:00.000+01:00'
					},
					{
						Position: { WGS84: 'POINT (18.0 60.0)' },
						TimeStamp: '2025-02-21T10:48:40.000+01:00'
					},
					{
						Position: { WGS84: 'POINT (16.8 58.8)' },
						TimeStamp: '2025-02-21T10:48:30.000+01:00'
					}
				],
				new Date(2025, 1, 21, 10, 49, 15, 0)
			)
		).toStrictEqual([59.4, 17.4]);
	});
});
