/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { act, waitFor } from '@testing-library/react';
import { compressToEncodedURIComponent } from 'lz-string';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
	renderHookWithRouter,
	renderWithRouter,
	type RenderWithRouterOptions,
	type TestRouter
} from '@/router/testing';
import { multipleSearch, runSearch } from '@/shared/utils';

import { GlobalRequirementsProvider, useGlobalRequirements } from './hooks';
import { useRunTableSetter } from './run-search.hooks';
import { ColumnId } from './run-table/types';
import {
	useRunTableQueryState,
	useTargetIterationId
} from './run-table/run-table.hooks';

// The two routes the run table renders in, wired as the app's route files
// wire them (`routes/-search/run.search.ts`, `multiple.search.ts`).
const RUN_ROUTE = { id: '/_app/runs/$runId/', search: runSearch };
const MULTIPLE_ROUTE = { id: '/_app/_runs/multiple', search: multipleSearch };

/** lz-string, then percent-encoded as `URLSearchParams` writes it. */
const lz = (value: unknown) =>
	new URLSearchParams({
		v: compressToEncodedURIComponent(JSON.stringify(value))
	})
		.toString()
		.slice('v='.length);

/** Plain JSON, percent-encoded as `URLSearchParams` writes it. */
const plain = (value: unknown) =>
	new URLSearchParams({ v: JSON.stringify(value) })
		.toString()
		.slice('v='.length);

const hrefOf = (router: TestRouter) => router.history.location.href;

function renderTableState(options: RenderWithRouterOptions = {}) {
	return renderHookWithRouter(() => useRunTableQueryState([]), {
		route: RUN_ROUTE,
		path: '/runs/1',
		...options
	});
}

beforeEach(() => {
	// The router scrolls the window once on load; jsdom has no `scrollTo`.
	vi.stubGlobal('scrollTo', vi.fn());
	localStorage.clear();
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('the run table search', () => {
	it('reads every key typed: compressed states, plain column order, repeated requirements', async () => {
		const search =
			`?expanded=${lz({ a: true })}&sorting=${lz([
				{ id: 'name', desc: true }
			])}` +
			`&globalFilter=${lz(['foo'])}&rowState=${lz({ r: { rowId: 'r' } })}` +
			`&visibility=${lz({ TOTAL: false })}&columnOrder=${plain([
				ColumnId.Tree
			])}` +
			'&targetIterationId=11&resultFilter=UNEXPECTED_TOTAL';
		const { result } = await renderTableState({ search });

		expect(result.current).toMatchObject({
			expanded: { a: true },
			sorting: [{ id: 'name', desc: true }],
			globalFilter: ['foo'],
			rowState: { r: { rowId: 'r' } },
			columnVisibility: { TOTAL: false },
			targetIterationId: 11,
			resultColumnId: 'UNEXPECTED_TOTAL'
		});
		expect(result.current.columnOrder[0]).toBe(ColumnId.Tree);
	});

	it('reads absent keys as the table defaults', async () => {
		const { result } = await renderTableState();

		expect(result.current).toMatchObject({
			expanded: {},
			sorting: [],
			globalFilter: [],
			rowState: {},
			targetIterationId: undefined,
			resultColumnId: undefined
		});
	});

	it('four writes in one handler make one replaced entry with every key, in write order', async () => {
		const { result, router } = await renderTableState({
			search: '?_s=abc',
			state: { openUnexpected: true }
		});

		await act(async () => {
			result.current.setExpanded({ a: true });
			result.current.setSorting([{ id: 'name', desc: false }]);
			result.current.setGlobalFilter(['foo']);
			result.current.setRowState({ r: { rowId: 'r', showToolbar: true } });
		});

		expect(hrefOf(router)).toBe(
			`/v2/runs/1?_s=abc&expanded=${lz({ a: true })}` +
				`&sorting=${lz([{ id: 'name', desc: false }])}` +
				`&globalFilter=${lz(['foo'])}` +
				`&rowState=${lz({ r: { rowId: 'r', showToolbar: true } })}`
		);
		expect(router.history.length).toBe(1);
		expect(router.history.location.state).toMatchObject({
			openUnexpected: true
		});
	});

	it('an update builds on the write before it in the same handler', async () => {
		const { result, router } = await renderTableState();

		await act(async () => {
			result.current.setExpanded((old) => ({ ...(old as object), a: true }));
			result.current.setExpanded((old) => ({ ...(old as object), b: true }));
		});

		expect(hrefOf(router)).toBe(
			`/v2/runs/1?expanded=${lz({ a: true, b: true })}`
		);
	});

	it('Back after expanding rows leaves the run page instead of stepping through the expansions', async () => {
		const { result, router } = await renderTableState({ path: '/dashboard' });

		// Never awaited inside `act`: fire it and wait for the page.
		void router.navigate({ to: '/runs/$runId', params: { runId: '1' } });
		await waitFor(() => expect(hrefOf(router)).toBe('/v2/runs/1'));

		await act(async () => result.current.setExpanded({ a: true }));
		await act(async () => result.current.setExpanded({ a: true, b: true }));

		expect(hrefOf(router)).toBe(
			`/v2/runs/1?expanded=${lz({ a: true, b: true })}`
		);
		expect(router.history.length).toBe(2);

		await act(async () => router.history.back());

		await waitFor(() => expect(hrefOf(router)).toBe('/v2/dashboard'));
	});

	it('writes the column order as plain JSON and the visibility compressed, both to localStorage too', async () => {
		const { result, router } = await renderTableState();

		await act(async () => {
			result.current.setColumnVisibility({ TOTAL: false });
			result.current.setColumnOrder(
				[...result.current.defaultColumnOrder].reverse()
			);
		});

		const order = [...result.current.defaultColumnOrder].reverse();

		expect(hrefOf(router)).toBe(
			`/v2/runs/1?visibility=${lz({ TOTAL: false })}&columnOrder=${plain(
				order
			)}`
		);
		expect(router.history.length).toBe(1);
		expect(JSON.parse(localStorage.getItem('run-column-order') ?? '')).toEqual(
			order
		);
		expect(
			JSON.parse(localStorage.getItem('run-column-visibility') ?? '')
		).toEqual({ TOTAL: false });
	});

	it('a plainly encoded run table state is rewritten as compressed as the page loads, with replace', async () => {
		const { router } = await renderTableState({
			search:
				`?globalFilter=${plain([])}&columnOrder=${plain([ColumnId.Tree])}` +
				`&expanded=${plain({ a: true })}&_s=abc`
		});

		await waitFor(() =>
			expect(hrefOf(router)).toBe(
				`/v2/runs/1?globalFilter=${lz([])}&columnOrder=${plain([
					ColumnId.Tree
				])}&expanded=${lz({ a: true })}&_s=abc`
			)
		);
		expect(router.history.length).toBe(1);
	});

	it('a plainly encoded run table state followed in the app is opened compressed', async () => {
		const { result, router } = await renderTableState({ path: '/dashboard' });

		void router.navigate({
			href: `/runs/1?rowState=${plain({ r: { rowId: 'r' } })}&sorting=${plain(
				[]
			)}`
		});

		await waitFor(() =>
			expect(hrefOf(router)).toBe(
				`/v2/runs/1?rowState=${lz({ r: { rowId: 'r' } })}&sorting=${lz([])}`
			)
		);
		expect(result.current.rowState).toEqual({ r: { rowId: 'r' } });
		expect(router.history.length).toBe(2);
	});

	it('clears the targeted iteration with replace, keeping the rest', async () => {
		const { result, router } = await renderHookWithRouter(
			useTargetIterationId,
			{
				route: RUN_ROUTE,
				path: '/runs/1',
				search: '?targetIterationId=11&resultFilter=UNEXPECTED_TOTAL'
			}
		);

		expect(result.current.targetIterationId).toBe(11);

		await act(async () => result.current.setTargetIterationId(null));

		expect(hrefOf(router)).toBe('/v2/runs/1?resultFilter=UNEXPECTED_TOTAL');
		expect(router.history.length).toBe(1);
	});

	it('merges a result table filter per row into the compressed columnFilters', async () => {
		const { result, router } = await renderHookWithRouter(
			() => useRunTableSetter('columnFilters', {}),
			{ route: RUN_ROUTE, path: '/runs/1' }
		);

		await act(async () => {
			result.current((prev) => ({ ...prev, r1: [{ id: 'a', value: ['x'] }] }));
			result.current((prev) => ({ ...prev, r2: [{ id: 'b', value: ['y'] }] }));
		});

		expect(hrefOf(router)).toBe(
			`/v2/runs/1?columnFilters=${lz({
				r1: [{ id: 'a', value: ['x'] }],
				r2: [{ id: 'b', value: ['y'] }]
			})}`
		);
		expect(router.history.length).toBe(1);
	});
});

describe('the location state of a link to the run', () => {
	it('opens the unexpected results of a fresh intent, even over persisted table state', async () => {
		const { result } = await renderTableState({
			search: `?rowState=${lz({})}`,
			state: { openUnexpectedResults: true, openUnexpectedIntentId: 'i-1' }
		});

		expect(result.current.locationState).toMatchObject({
			openUnexpectedResults: true,
			openUnexpectedIntentId: 'i-1'
		});
	});

	it('ignores the legacy booleans once the table state is persisted', async () => {
		const { result } = await renderTableState({
			search: `?rowState=${lz({})}`,
			state: { openUnexpected: true }
		});

		expect(result.current.locationState).toBeUndefined();
	});

	it('honours the legacy booleans on a link without table state', async () => {
		const { result } = await renderTableState({
			state: { openUnexpected: true }
		});

		expect(result.current.locationState).toMatchObject({
			openUnexpected: true
		});
	});
});

describe('the global requirements (repeated globalRequirements)', () => {
	it('reads one requirement per key and writes them back repeated, with replace', async () => {
		let state = {} as ReturnType<typeof useGlobalRequirements>;

		function Reader() {
			state = useGlobalRequirements();
			return null;
		}

		const { router } = await renderWithRouter(
			<GlobalRequirementsProvider>
				<Reader />
			</GlobalRequirementsProvider>,
			{
				route: RUN_ROUTE,
				path: '/runs/1',
				search: '?globalRequirements=a&globalRequirements=b+c'
			}
		);

		expect(state.globalRequirements).toEqual(['a', 'b c']);

		await act(async () => state.setGlobalRequirements(['x y', 'z']));

		expect(hrefOf(router)).toBe(
			'/v2/runs/1?globalRequirements=x+y&globalRequirements=z'
		);
		expect(state.globalRequirements).toEqual(['x y', 'z']);
		expect(router.history.length).toBe(1);

		await act(async () => state.resetGlobalRequirements());

		expect(hrefOf(router)).toBe('/v2/runs/1');
	});
});

describe('the run table on /multiple', () => {
	it('writes the table state after the pinned runs, the selection and the mode', async () => {
		const { result, router } = await renderHookWithRouter(
			() => useRunTableQueryState([]),
			{
				route: MULTIPLE_ROUTE,
				path: '/multiple',
				search: '?runIds=1&runIds=2&selected=2&isModeFull=1'
			}
		);

		await act(async () => {
			result.current.setExpanded({ a: true });
			result.current.setGlobalFilter(['foo']);
		});

		expect(hrefOf(router)).toBe(
			`/v2/multiple?runIds=1&runIds=2&selected=2&isModeFull=1` +
				`&expanded=${lz({ a: true })}&globalFilter=${lz(['foo'])}`
		);
		expect(router.history.length).toBe(1);
	});
});
