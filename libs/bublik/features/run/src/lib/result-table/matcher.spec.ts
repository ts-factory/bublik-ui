import { describe, it, expect } from 'vitest';
import {
	DiffValue,
	getCommonParameters,
	highlightDifferences
} from './matcher';

describe('highlightDifference', () => {
	it('should handle empty input and reference', () => {
		const input = { current: [], reference: [] };
		const expected: DiffValue[] = [];
		expect(highlightDifferences(input.current, input.reference)).toMatchObject(
			expected
		);
	});
	it('should handle when reference has one additional param', () => {
		const input = { current: ['1=1'], reference: ['1=1', '2=2'] };
		const expected: DiffValue[] = [{ value: '1=1' }];
		expect(highlightDifferences(input.current, input.reference)).toMatchObject(
			expected
		);
	});
	it('should handle when reference has missing params', () => {
		const input = { current: [], reference: ['1=1'] };
		const expected: DiffValue[] = [];
		expect(highlightDifferences(input.current, input.reference)).toMatchObject(
			expected
		);
	});
	it('should handle diff', () => {
		const input = {
			current: [
				'bad_reqs_p=10',
				'cps=1000',
				'env=VAR.env.peer2peer.two_links',
				'fw_mode=no-rules',
				'fw_proto=af-packet-rss',
				'fw_threads=test-auto',
				'req_size=64',
				'resp_size=64',
				'test_mode=trex',
				'test_proto=http',
				'tot_reqs=1000'
			],
			reference: [
				'bad_reqs_p=10',
				'connections=2048',
				'env=VAR.env.peer2peer.two_links',
				'fw_mode=no-rules',
				'fw_proto=af-packet-rss',
				'fw_threads=test-auto',
				'req_size=0',
				'resp_size=1',
				'test_mode=wrk-httpterm',
				'test_pin_cpu=TRUE',
				'wrk_many_processes=TRUE',
				'wrk_threads=auto'
			]
		};
		const expected: DiffValue[] = [
			{ value: 'bad_reqs_p=10' },
			{ value: 'cps=1000' },
			{ value: 'env=VAR.env.peer2peer.two_links' },
			{ value: 'fw_mode=no-rules' },
			{ value: 'fw_proto=af-packet-rss' },
			{ value: 'fw_threads=test-auto' },
			{ value: 'req_size=64', isDifferent: true },
			{ value: 'resp_size=64', isDifferent: true },
			{ value: 'test_mode=trex', isDifferent: true },
			{ value: 'test_proto=http' },
			{ value: 'tot_reqs=1000' }
		];
		expect(highlightDifferences(input.current, input.reference)).toMatchObject(
			expected
		);
	});
});

describe('getCommonParameters', () => {
	it('returns common parameters for comparable rows', () => {
		const result = getCommonParameters([
			['a=1', 'b=2', 'c=3'],
			['a=1', 'b=2', 'x=9'],
			['a=1', 'b=2', 'y=8']
		]);

		expect([...result]).toEqual(['a=1', 'b=2']);
	});

	it('ignores rows without parameters', () => {
		const result = getCommonParameters([
			['a=1', 'b=2'],
			[],
			['a=1', 'c=3'],
			[]
		]);

		expect([...result]).toEqual(['a=1']);
	});

	it('returns empty set when fewer than two comparable rows exist', () => {
		const result = getCommonParameters([['a=1', 'b=2'], [], []]);

		expect([...result]).toEqual([]);
	});
});
