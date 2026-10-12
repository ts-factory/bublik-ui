/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter
} from '@tanstack/react-router';

import {
	bool01,
	boolTrue,
	compressedJson,
	date,
	delimited,
	enumOf,
	json,
	keepRaw,
	num,
	passthrough,
	repeated,
	repeatedNum,
	str
} from './codecs';
import { defineSearch, type InferSearch } from './define-search';
import { parseSearch, stringifySearch } from './wire';

// A stand-in `/runs` schema that exercises every codec (the real `/runs` keeps
// `page` raw). The root schema is the app's global one.
const rootSearch = defineSearch(
	{
		project: repeatedNum(),
		_s: str(),
		'hide-sidebar': passthrough(),
		'settings-open': bool01(),
		'settings-tab': enumOf(['account', 'appearance', 'beta', 'preferences'])
	},
	{ 'settings-open': false, 'settings-tab': 'account' }
);

const runsSearch = defineSearch(
	{
		page: num(),
		pageSize: num(),
		mode: enumOf(['table', 'charts', 'progress']),
		tv: bool01(),
		legacy: boolTrue(),
		main: date(),
		expanded: compressedJson<Record<string, boolean>>(),
		columnOrder: json<string[]>(),
		globalRequirements: repeated(),
		runData: delimited(';'),
		extra: passthrough()
	},
	{ page: 1, mode: 'table' }
);

type RunsSearch = InferSearch<typeof runsSearch>;

async function routerAt(href: string) {
	const root = createRootRoute({
		validateSearch: rootSearch.validateSearch,
		search: { middlewares: rootSearch.middlewares }
	});
	const runs = createRoute({
		getParentRoute: () => root,
		path: '/runs',
		validateSearch: runsSearch.validateSearch,
		search: { middlewares: runsSearch.middlewares }
	});
	const router = createRouter({
		routeTree: root.addChildren([runs]),
		history: createMemoryHistory({ initialEntries: [href] }),
		basepath: '/v2',
		parseSearch,
		stringifySearch
	});

	await router.load();

	return router;
}

type TestRouter = Awaited<ReturnType<typeof routerAt>>;

const href = (router: TestRouter) => router.history.location.href;

/** The validated search of the `/runs` match. */
const searchOf = (router: TestRouter) =>
	router.state.matches[1].search as RunsSearch;

describe('the typed search', () => {
	it('has optional keys, so a partial search object type-checks', () => {
		expectTypeOf<RunsSearch>().toMatchTypeOf<{
			page?: number;
			mode?: 'table' | 'charts' | 'progress' | (string & NonNullable<unknown>);
			main?: Date;
			globalRequirements?: string[];
		}>();

		const partial: RunsSearch = { page: 2 };

		expect(partial.page).toBe(2);
	});
});

describe('defineSearch through a router', () => {
	it('a typed search becomes the hand-written href, one codec per key, in the given order', async () => {
		const router = await routerAt('/v2/runs');

		const location = router.buildLocation({
			to: '/runs',
			search: {
				page: 2,
				mode: 'charts',
				tv: true,
				legacy: false,
				main: new Date(2026, 3, 19),
				expanded: { '0': true },
				columnOrder: ['a', 'b'],
				globalRequirements: ['x', 'y'],
				runData: ['a=b', 'c=d'],
				extra: ['1', '2'],
				project: [1, 2]
			} satisfies RunsSearch
		});

		expect(location.href).toBe(
			'/v2/runs?page=2&mode=charts&tv=1&legacy=false&main=2026-04-19' +
				'&expanded=N4IgDCBcAuBOCuBTAvkA&columnOrder=%5B%22a%22%2C%22b%22%5D' +
				'&globalRequirements=x&globalRequirements=y&runData=a%3Db%3Bc%3Dd' +
				'&extra=1&extra=2&project=1&project=2'
		);
	});

	it('useSearch sees typed values and unknown keys; withDefaults fills the page defaults at read time', async () => {
		const router = await routerAt(
			'/v2/runs?page=2&legacy=true&main=2026-04-19&expanded=N4IgDCBcAuBOCuBTAvkA&foo=bar&project=1&project=2'
		);
		const search = searchOf(router);

		expect(search.page).toBe(2);
		expect(search.legacy).toBe(true);
		expect(search.main).toBeInstanceOf(Date);
		expect(search.expanded).toEqual({ '0': true });
		expect(search['foo']).toBe('bar');
		expect(search.project).toEqual([1, 2]);
		expect(search.mode).toBeUndefined();

		const withDefaults = runsSearch.withDefaults(search);
		expect(withDefaults.mode).toBe('table');
		expect(withDefaults.page).toBe(2);
	});

	it('a functional updater receives typed values, keeps unknown keys and key order, writes wire strings', async () => {
		const router = await routerAt('/v2/runs?page=1&_s=abc&foo=bar');
		let seen: RunsSearch | undefined;

		await router.navigate({
			to: '/runs',
			search: (prev: RunsSearch) => {
				seen = prev;
				return { ...prev, page: 2 };
			},
			replace: true
		});

		expect(seen?.page).toBe(1);
		expect(seen?._s).toBe('abc');
		expect(href(router)).toBe('/v2/runs?page=2&_s=abc&foo=bar');
	});

	it('writes new keys after the existing ones, in write order, like URLSearchParams.set', async () => {
		const router = await routerAt('/v2/runs?pageSize=50');

		await router.navigate({
			to: '/runs',
			search: (prev: RunsSearch) => ({ ...prev, mode: 'charts', page: 2 }),
			replace: true
		});

		expect(href(router)).toBe('/v2/runs?pageSize=50&mode=charts&page=2');
	});

	it('fills no defaults: an unrelated update does not write page=1 or mode=table', async () => {
		const router = await routerAt('/v2/runs');

		await router.navigate({
			to: '/runs',
			search: (prev: RunsSearch) => ({ ...prev, pageSize: 50 }),
			replace: true
		});

		expect(href(router)).toBe('/v2/runs?pageSize=50');
	});

	it('an explicit write of a default value is kept (links write mode=table on purpose)', async () => {
		const router = await routerAt('/v2/runs');

		await router.navigate({ to: '/runs', search: { mode: 'table' } });

		expect(href(router)).toBe('/v2/runs?mode=table');
	});

	it('an object search replaces every key, like setSearchParams(params) today', async () => {
		const router = await routerAt('/v2/runs?page=1&_s=abc');

		expect(
			router.buildLocation({ to: '/runs', search: { mode: 'charts' } }).href
		).toBe('/v2/runs?mode=charts');
	});

	it('raw wire values (what untyped writers pass) come out byte-identical, in <Link> hrefs too', async () => {
		const router = await routerAt('/v2/runs?page=1');
		const wire = {
			tv: '0',
			legacy: 'false',
			page: '3',
			main: '2024-02-09',
			globalRequirements: ['a', 'b'],
			runData: 'x;y',
			columnOrder: '["a","b"]',
			project: ['1', '2'],
			'settings-open': '0'
		};

		// Without `_includeValidateSearch` nothing turns the strings into typed
		// values before the middleware serializes them: `'0'` is truthy.
		expect(router.buildLocation({ to: '/runs', search: wire }).href).toBe(
			'/v2/runs?tv=0&legacy=false&page=3&main=2024-02-09&globalRequirements=a&globalRequirements=b&runData=x%3By&columnOrder=%5B%22a%22%2C%22b%22%5D&project=1&project=2&settings-open=0'
		);

		await router.navigate({ to: '/runs', search: wire });

		expect(href(router)).toBe(
			'/v2/runs?tv=0&legacy=false&page=3&main=2024-02-09&globalRequirements=a&globalRequirements=b&runData=x%3By&columnOrder=%5B%22a%22%2C%22b%22%5D&project=1&project=2&settings-open=0'
		);
	});

	it('a null value (use-query-params "remove") drops the key in a middleware too', async () => {
		const router = await routerAt('/v2/runs?page=1&tv=1');

		expect(
			router.buildLocation({ to: '/runs', search: { page: '2', tv: null } })
				.href
		).toBe('/v2/runs?page=2');
	});

	it('an unknown enum value survives an unrelated update', async () => {
		const router = await routerAt('/v2/runs?mode=bogus');

		await router.navigate({
			to: '/runs',
			search: (prev: RunsSearch) => ({ ...prev, page: 2 }),
			replace: true
		});

		expect(href(router)).toBe('/v2/runs?mode=bogus&page=2');
	});

	it('an unparsable number or date reads as undefined and is dropped on the next write', async () => {
		const router = await routerAt('/v2/runs?page=abc&main=YYYY-MM-DD&_s=x');
		const search = searchOf(router);

		expect(search.page).toBeUndefined();
		expect(search.main).toBeUndefined();

		await router.navigate({
			to: '/runs',
			search: (prev: RunsSearch) => ({ ...prev, pageSize: 50 }),
			replace: true
		});

		expect(href(router)).toBe('/v2/runs?_s=x&pageSize=50');
	});

	it('a keepRaw key keeps an unparsable value through an unrelated update', async () => {
		const schema = defineSearch({ main: keepRaw(date()), mode: str() });
		const root = createRootRoute();
		const dashboard = createRoute({
			getParentRoute: () => root,
			path: '/dashboard',
			validateSearch: schema.validateSearch,
			search: { middlewares: schema.middlewares }
		});
		const router = createRouter({
			routeTree: root.addChildren([dashboard]),
			history: createMemoryHistory({
				initialEntries: ['/v2/dashboard?main=not-a-date&mode=rows']
			}),
			basepath: '/v2',
			parseSearch,
			stringifySearch
		});
		await router.load();

		expect(router.state.matches[1].search).toMatchObject({
			main: 'not-a-date'
		});

		await router.navigate({
			to: '/dashboard',
			search: (prev: Record<string, unknown>) => ({ ...prev, _s: 'abc' }),
			replace: true
		});

		expect(router.history.location.href).toBe(
			'/v2/dashboard?main=not-a-date&mode=rows&_s=abc'
		);
	});

	it('setting a key to undefined removes it; the empty string writes key=', async () => {
		const router = await routerAt('/v2/runs?page=3&runData=a%3Db');

		await router.navigate({
			to: '/runs',
			search: (prev: RunsSearch) => ({ ...prev, page: undefined, runData: [] }),
			replace: true
		});

		expect(href(router)).toBe('/v2/runs?runData=');
	});

	it('a repeated numeric root key round-trips through a child navigation', async () => {
		const router = await routerAt('/v2/runs?project=1&project=2');

		await router.navigate({
			to: '/runs',
			search: (prev: RunsSearch) => ({ ...prev, page: 2 }),
			replace: true
		});

		expect(href(router)).toBe('/v2/runs?project=1&project=2&page=2');
	});

	it('legacy plain-JSON expanded is read and written back compressed on the next write', async () => {
		const router = await routerAt('/v2/runs?expanded=%7B%220%22%3Atrue%7D');

		expect(searchOf(router).expanded).toEqual({ '0': true });

		await router.navigate({
			to: '/runs',
			search: (prev: RunsSearch) => ({ ...prev, page: 2 }),
			replace: true
		});

		expect(href(router)).toBe('/v2/runs?expanded=N4IgDCBcAuBOCuBTAvkA&page=2');
	});

	it('four replace navigations in one tick coalesce into one entry with every key', async () => {
		const router = await routerAt('/v2/runs');
		const entriesBefore = router.history.length;

		await Promise.all([
			router.navigate({
				to: '/runs',
				search: (p: RunsSearch) => ({ ...p, page: 1 }),
				replace: true
			}),
			router.navigate({
				to: '/runs',
				search: (p: RunsSearch) => ({ ...p, pageSize: 25 }),
				replace: true
			}),
			router.navigate({
				to: '/runs',
				search: (p: RunsSearch) => ({ ...p, mode: 'charts' }),
				replace: true
			}),
			router.navigate({
				to: '/runs',
				search: (p: RunsSearch) => ({ ...p, tv: true }),
				replace: true
			})
		]);

		expect(href(router)).toBe('/v2/runs?page=1&pageSize=25&mode=charts&tv=1');
		expect(router.history.length).toBe(entriesBefore);
	});
});

describe('why defaults live in withDefaults and not in validateSearch', () => {
	// A default filled by validateSearch reaches the updater as a real value and
	// is written to the URL on the first unrelated update.
	it('a default filled by validateSearch is written on the next update', async () => {
		const root = createRootRoute();
		const runs = createRoute({
			getParentRoute: () => root,
			path: '/runs',
			validateSearch: (raw: Record<string, unknown>) => ({
				...raw,
				mode: (raw['mode'] as string | undefined) ?? 'table'
			})
		});
		const router = createRouter({
			routeTree: root.addChildren([runs]),
			history: createMemoryHistory({ initialEntries: ['/v2/runs'] }),
			basepath: '/v2',
			parseSearch,
			stringifySearch
		});
		await router.load();

		await router.navigate({
			to: '/runs',
			search: (prev: Record<string, unknown>) => ({ ...prev, page: '2' }),
			replace: true
		});

		expect(router.history.location.href).toBe('/v2/runs?mode=table&page=2');
	});
});

describe('the order TanStack runs validateSearch, the middlewares and the updater', () => {
	// Pinned by the Phase 0 spike: buildLocation seeds the chain with the leaf
	// match's *validated* search and only navigate() re-validates the result.
	// This is why validateSearch fills no defaults and codecs are idempotent.
	async function tracedRouter(initial: string) {
		const log: string[] = [];
		const trace = (name: string, shape: ReturnType<typeof defineSearch>) => ({
			validateSearch: (raw: Record<string, unknown>) => {
				log.push(`${name}.validate`);
				return shape.validateSearch(raw);
			},
			search: {
				middlewares: [
					({
						search,
						next
					}: {
						search: Record<string, unknown>;
						next: (s: Record<string, unknown>) => Record<string, unknown>;
					}) => {
						log.push(`${name}.mw.in(${typeof search['page']})`);
						const result = shape.middlewares[0]({ search, next });
						log.push(`${name}.mw.out(${typeof result['page']})`);
						return result;
					}
				]
			}
		});
		const root = createRootRoute(trace('root', defineSearch({})));
		const runsOptions = trace('runs', defineSearch({ page: num() }));
		const runs = createRoute({
			getParentRoute: () => root,
			path: '/runs',
			...runsOptions
		});
		const router = createRouter({
			routeTree: root.addChildren([runs]),
			history: createMemoryHistory({ initialEntries: [initial] }),
			basepath: '/v2',
			parseSearch,
			stringifySearch
		});
		await router.load();
		log.length = 0;

		return { router, log };
	}

	it('navigate(): validate current → middlewares in → updater(typed) → leaf validate → middlewares out → commit', async () => {
		const { router, log } = await tracedRouter('/v2/runs?page=1');

		await router.navigate({
			to: '/runs',
			search: (prev: { page?: number }) => {
				log.push(`updater(${typeof prev.page})`);
				return { ...prev, page: 2 };
			},
			replace: true
		});

		expect(log).toEqual([
			'root.validate',
			'runs.validate',
			'root.mw.in(number)',
			'runs.mw.in(number)',
			'updater(number)',
			'runs.validate',
			'runs.mw.out(string)',
			'root.validate',
			'root.mw.out(string)',
			'root.validate',
			'runs.validate'
		]);
		expect(href(router)).toBe('/v2/runs?page=2');
	});

	it('buildLocation() (what <Link> renders): the same, without the re-validation of the result', async () => {
		const { router, log } = await tracedRouter('/v2/runs?page=1');

		const location = router.buildLocation({ to: '/runs', search: { page: 2 } });

		expect(log).toEqual([
			'root.validate',
			'runs.validate',
			'root.mw.in(number)',
			'runs.mw.in(number)',
			'runs.mw.out(string)',
			'root.mw.out(string)'
		]);
		expect(location.href).toBe('/v2/runs?page=2');
	});
});
