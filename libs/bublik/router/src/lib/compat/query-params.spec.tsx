/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it, vi } from 'vitest';
import {
	compressToEncodedURIComponent,
	decompressFromEncodedURIComponent
} from 'lz-string';

import { hrefOf, renderHookAt, write } from '../../test/compat-router';
import { useLocation } from './navigation';
import {
	ArrayParam,
	BooleanParam,
	DateParam,
	JsonParam,
	NumberParam,
	NumericArrayParam,
	StringParam,
	useQueryParam,
	useQueryParams,
	withDefault,
	type QueryParamConfig
} from './query-params';

// Expected encodings are serialize-query-params 2.0.2's, which the pages
// write today.
describe('the standard param configs', () => {
	it('StringParam', () => {
		expect(StringParam.encode('a')).toBe('a');
		expect(StringParam.encode(null)).toBeNull();
		expect(StringParam.encode(undefined)).toBeUndefined();
		expect(StringParam.decode('a')).toBe('a');
		expect(StringParam.decode(['a', 'b'])).toBe('a');
		expect(StringParam.decode('')).toBe('');
		expect(StringParam.decode(undefined)).toBeUndefined();
		expect(StringParam.decode(null)).toBeNull();
	});

	it('NumberParam', () => {
		expect(NumberParam.encode(2)).toBe('2');
		expect(NumberParam.encode(null)).toBeNull();
		expect(NumberParam.decode('2')).toBe(2);
		expect(NumberParam.decode('')).toBeNull();
		expect(NumberParam.decode('abc')).toBeNaN();
		expect(NumberParam.decode(undefined)).toBeUndefined();
	});

	it('BooleanParam writes 1/0 and reads anything else as null', () => {
		expect(BooleanParam.encode(true)).toBe('1');
		expect(BooleanParam.encode(false)).toBe('0');
		expect(BooleanParam.decode('1')).toBe(true);
		expect(BooleanParam.decode('0')).toBe(false);
		expect(BooleanParam.decode('true')).toBeNull();
		expect(BooleanParam.decode(undefined)).toBeUndefined();
	});

	it('DateParam writes local YYYY-MM-DD and reads it leniently', () => {
		expect(DateParam.encode(new Date(2024, 1, 9))).toBe('2024-02-09');
		expect(DateParam.decode('2024-02-09')).toEqual(new Date(2024, 1, 9));
		expect(DateParam.decode('2024')).toEqual(new Date(2024, 0, 1));
		expect(DateParam.decode('nope')).toBeNull();
		expect(DateParam.decode(undefined)).toBeUndefined();
	});

	it('JsonParam', () => {
		expect(JsonParam.encode({ a: [1] })).toBe('{"a":[1]}');
		expect(JsonParam.decode('{"a":[1]}')).toEqual({ a: [1] });
		expect(JsonParam.decode('{')).toBeNull();
		expect(JsonParam.decode(undefined)).toBeUndefined();
	});

	it('ArrayParam and NumericArrayParam', () => {
		expect(ArrayParam.encode(['a', 'b'])).toEqual(['a', 'b']);
		expect(ArrayParam.decode(['a', 'b'])).toEqual(['a', 'b']);
		expect(ArrayParam.decode('a')).toEqual(['a']);
		expect(ArrayParam.decode('')).toEqual([]);
		expect(ArrayParam.decode(undefined)).toBeUndefined();
		expect(NumericArrayParam.encode([1, 2])).toEqual(['1', '2']);
		expect(NumericArrayParam.decode(['1', '2'])).toEqual([1, 2]);
		expect(NumericArrayParam.decode(['1', ''])).toEqual([1, null]);
	});

	it('withDefault fills undefined and, by default, null', () => {
		const param = withDefault(BooleanParam, false);

		expect(param.decode(undefined)).toBe(false);
		expect(param.decode('true')).toBe(false);
		expect(param.decode('1')).toBe(true);
		expect(param.default).toBe(false);
		expect(withDefault(StringParam, 'x', false).decode(null)).toBeNull();
	});
});

const lz = (value: unknown) =>
	compressToEncodedURIComponent(JSON.stringify(value));

describe('useQueryParam (use-query-params shape, provider updateType replaceIn)', () => {
	it('reads the decoded value, undefined when absent', async () => {
		const { result } = await renderHookAt(
			'/runs?page=2&tv=1&globalRequirements=a&globalRequirements=b',
			() => ({
				page: useQueryParam('page', NumberParam)[0],
				tv: useQueryParam('tv', withDefault(BooleanParam, false))[0],
				reqs: useQueryParam('globalRequirements', ArrayParam)[0],
				mode: useQueryParam('mode', StringParam)[0]
			})
		);

		expect(result.current).toEqual({
			page: 2,
			tv: true,
			reqs: ['a', 'b'],
			mode: undefined
		});
	});

	it('a write merges into the current search, replacing the entry', async () => {
		const { router, result } = await renderHookAt(
			'/runs?page=2&project=1&project=2&_s=abc',
			() => useQueryParam('tv', withDefault(BooleanParam, false))
		);

		await write(() => result.current[1](true));

		expect(hrefOf(router)).toBe(
			'/v2/runs?page=2&project=1&project=2&_s=abc&tv=1'
		);
		expect(router.history.length).toBe(1);
		expect(result.current[0]).toBe(true);
	});

	it('an existing key keeps its position, as URLSearchParams.set does', async () => {
		const { router, result } = await renderHookAt(
			'/runs?tv=1&page=2&_s=abc',
			() => useQueryParam('tv', BooleanParam)
		);

		await write(() => result.current[1](false));

		expect(hrefOf(router)).toBe('/v2/runs?tv=0&page=2&_s=abc');
	});

	it('undefined and null remove the key', async () => {
		const { router, result } = await renderHookAt(
			'/runs?page=2&tv=1&mode=charts',
			() => ({
				tv: useQueryParam('tv', BooleanParam),
				mode: useQueryParam('mode', StringParam)
			})
		);

		await write(() => result.current.tv[1](undefined));
		expect(hrefOf(router)).toBe('/v2/runs?page=2&mode=charts');

		await write(() => result.current.mode[1](null));
		expect(hrefOf(router)).toBe('/v2/runs?page=2');
	});

	it('a functional update receives the latest decoded value', async () => {
		const { router, result } = await renderHookAt(
			'/runs/1?selectedCharts=1&selectedCharts=2',
			() => useQueryParam('selectedCharts', withDefault(NumericArrayParam, []))
		);

		await write(() => result.current[1]((prev) => [...(prev || []), 3]));

		expect(hrefOf(router)).toBe(
			'/v2/runs/1?selectedCharts=1&selectedCharts=2&selectedCharts=3'
		);
	});

	it('several writes in one handler coalesce into one entry with every key', async () => {
		const { router, result } = await renderHookAt('/runs?page=1', () => ({
			columnOrder: useQueryParam('columnOrder', JsonParam),
			sorting: useQueryParam('sorting', JsonParam),
			tv: useQueryParam('tv', BooleanParam),
			mode: useQueryParam('mode', StringParam)
		}));

		await write(() => {
			result.current.columnOrder[1](['a', 'b']);
			result.current.sorting[1]([{ id: 'a', desc: true }]);
			result.current.tv[1](true);
			result.current.mode[1]('charts');
		});

		expect(hrefOf(router)).toBe(
			'/v2/runs?page=1&columnOrder=%5B%22a%22%2C%22b%22%5D&sorting=%5B%7B%22id%22%3A%22a%22%2C%22desc%22%3Atrue%7D%5D&tv=1&mode=charts'
		);
		expect(router.history.length).toBe(1);
	});

	it('writes a custom compressed config through a route that declares the key compressed', async () => {
		const compressed: QueryParamConfig<unknown, unknown> = {
			encode: (value) => (value == null ? value : lz(value)),
			decode: (value) =>
				typeof value === 'string'
					? JSON.parse(decompressFromEncodedURIComponent(value))
					: undefined
		};
		const { router, result } = await renderHookAt('/runs', () =>
			useQueryParam('expanded', withDefault(compressed, {}))
		);

		await write(() => result.current[1]({ a: true }));

		expect(hrefOf(router)).toBe(
			`/v2/runs?expanded=${new URLSearchParams({ v: lz({ a: true }) })
				.toString()
				.slice(2)}`
		);
		expect(result.current[0]).toEqual({ a: true });
	});

	it('a plain-JSON write on a compressed key is written back compressed (the legacy migration)', async () => {
		const { router, result } = await renderHookAt('/runs', () =>
			useQueryParam('expanded', JsonParam)
		);

		await write(() => result.current[1]({ '0': true }));

		expect(hrefOf(router)).toBe(
			`/v2/runs?expanded=${new URLSearchParams({ v: lz({ '0': true }) })
				.toString()
				.slice(2)}`
		);
	});

	it('pushIn pushes an entry; push and replace drop the other keys', async () => {
		const { router, result } = await renderHookAt('/runs?page=2&_s=abc', () =>
			useQueryParam('mode', StringParam)
		);

		await write(() => result.current[1]('charts', 'pushIn'));
		expect(hrefOf(router)).toBe('/v2/runs?page=2&_s=abc&mode=charts');
		expect(router.history.length).toBe(2);

		await write(() => result.current[1]('table', 'replace'));
		expect(hrefOf(router)).toBe('/v2/runs?mode=table');
		expect(router.history.length).toBe(2);

		await write(() => result.current[1]('progress', 'push'));
		expect(hrefOf(router)).toBe('/v2/runs?mode=progress');
		expect(router.history.length).toBe(3);
	});

	it('the hook options updateType is the default for its setter', async () => {
		const { router, result } = await renderHookAt('/runs?page=2', () =>
			useQueryParam('mode', StringParam, { updateType: 'pushIn' })
		);

		await write(() => result.current[1]('charts'));

		expect(hrefOf(router)).toBe('/v2/runs?page=2&mode=charts');
		expect(router.history.length).toBe(2);
	});

	it('drops the hash and keeps the state, as the React Router 6 adapter did', async () => {
		const { router, result } = await renderHookAt(
			'/runs/1/report?config=2#anchor',
			() => ({
				open: useQueryParam('isFullMode', BooleanParam),
				location: useLocation()
			})
		);

		await write(() => result.current.open[1](false));

		expect(hrefOf(router)).toBe('/v2/runs/1/report?config=2&isFullMode=0');
		expect(result.current.location.state).toBe(result.current.location.state);
	});

	it('does not navigate when the search string would not change', async () => {
		const { router, result } = await renderHookAt('/runs?page=2#anchor', () =>
			useQueryParam('page', NumberParam)
		);
		const spy = vi.spyOn(router, 'navigate');

		await write(() => result.current[1](2));

		expect(spy).not.toHaveBeenCalled();
		expect(hrefOf(router)).toBe('/v2/runs?page=2#anchor');
	});

	it('does not touch the window scroll', async () => {
		const scrollTo = vi.fn();
		vi.stubGlobal('scrollTo', scrollTo);
		const { result } = await renderHookAt('/runs?page=2', () =>
			useQueryParam('page', NumberParam)
		);
		scrollTo.mockClear();

		await write(() => result.current[1](3));

		expect(scrollTo).not.toHaveBeenCalled();
		vi.unstubAllGlobals();
	});

	it('keeps the setter stable across renders even with an inline config', async () => {
		const { result, rerender } = await renderHookAt('/runs', () =>
			useQueryParam('tv', withDefault(BooleanParam, false))
		);
		const first = result.current[1];

		rerender();

		expect(result.current[1]).toBe(first);
	});

	it('keeps a decoded object identical while its wire value is unchanged', async () => {
		const { result, rerender } = await renderHookAt(
			'/runs?columnOrder=%5B%22a%22%5D',
			() => useQueryParam('columnOrder', JsonParam)
		);
		const first = result.current[0];

		rerender();

		expect(result.current[0]).toBe(first);
	});
});

describe('useQueryParams (use-query-params shape)', () => {
	const config = {
		page: NumberParam,
		q: StringParam,
		tv: withDefault(BooleanParam, false)
	};

	it('reads every key and writes a batch of changes as one replace', async () => {
		const { router, result } = await renderHookAt(
			'/runs?page=3&project=1',
			() => useQueryParams(config)
		);

		expect(result.current[0]).toEqual({ page: 3, q: undefined, tv: false });

		await write(() =>
			result.current[1](
				{ page: undefined, q: 'timeout', tv: true },
				'replaceIn'
			)
		);

		expect(hrefOf(router)).toBe('/v2/runs?project=1&q=timeout&tv=1');
		expect(router.history.length).toBe(1);
		expect(result.current[0]).toEqual({
			page: undefined,
			q: 'timeout',
			tv: true
		});
	});

	it('a functional update receives the latest decoded values', async () => {
		const { router, result } = await renderHookAt('/runs?page=3', () =>
			useQueryParams(config)
		);

		await write(() =>
			result.current[1]((latest) => ({ page: (latest.page ?? 0) + 1 }))
		);

		expect(hrefOf(router)).toBe('/v2/runs?page=4');
	});

	it('encodes a key the map does not declare as a string', async () => {
		const { router, result } = await renderHookAt('/runs', () =>
			useQueryParams(config)
		);

		await write(() => result.current[1]({ extra: 'x' } as never));

		expect(hrefOf(router)).toBe('/v2/runs?extra=x');
	});
});
