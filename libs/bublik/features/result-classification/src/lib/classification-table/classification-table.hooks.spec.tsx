/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';

import type { VisibilityState } from '@tanstack/react-table';

import {
	useClassificationTableState,
	useColumnVisibility
} from './classification-table.hooks';

const FILTER_KEYS = ['state', 'category'] as const;

function wrapperFor(initialEntry: string) {
	return function Wrapper({ children }: PropsWithChildren) {
		return (
			<MemoryRouter initialEntries={[initialEntry]}>
				<QueryParamProvider
					adapter={ReactRouter6Adapter}
					options={{ updateType: 'replaceIn' }}
				>
					{children}
				</QueryParamProvider>
			</MemoryRouter>
		);
	};
}

function setup(initialEntry = '/issues') {
	return renderHook(
		() => ({
			state: useClassificationTableState({
				filterKeys: FILTER_KEYS,
				searchColumnId: 'issue',
				defaultPageSize: 25,
				defaultSorting: [{ id: 'created', desc: true }]
			}),
			search: useLocation().search
		}),
		{ wrapper: wrapperFor(initialEntry) }
	);
}

function pairs(search: string) {
	return [...new URLSearchParams(search).entries()]
		.map(([key, value]) => `${key}=${value}`)
		.sort();
}

describe('useClassificationTableState', () => {
	describe('defaults are absent, not written', () => {
		it('starts with an empty query string', () => {
			const { result } = setup();

			expect(result.current.search).toBe('');
			expect(result.current.state.pagination).toEqual({
				pageIndex: 0,
				pageSize: 25
			});
			expect(result.current.state.sorting).toEqual([
				{ id: 'created', desc: true }
			]);
			expect(result.current.state.hasFilters).toBe(false);
		});

		it('drops page and pageSize again once they return to the default', () => {
			const { result } = setup('/issues?page=3&pageSize=50');

			expect(result.current.state.pagination).toEqual({
				pageIndex: 2,
				pageSize: 50
			});

			act(() =>
				result.current.state.onPaginationChange({ pageIndex: 0, pageSize: 25 })
			);

			expect(result.current.search).toBe('');
		});

		it('drops sort when it returns to the default column and direction', () => {
			const { result } = setup('/issues?sort=title:asc');

			expect(result.current.state.sorting).toEqual([
				{ id: 'title', desc: false }
			]);

			act(() =>
				result.current.state.onSortingChange([{ id: 'created', desc: true }])
			);

			expect(result.current.search).toBe('');
		});
	});

	describe('the URL contract', () => {
		it('writes sorting as <id>:asc|desc', () => {
			const { result } = setup();

			act(() =>
				result.current.state.onSortingChange([{ id: 'title', desc: false }])
			);

			expect(result.current.search).toBe('?sort=title%3Aasc');
		});

		it('writes explicitly-cleared sorting as the none sentinel', () => {
			const { result } = setup();

			act(() => result.current.state.onSortingChange([]));

			expect(result.current.search).toBe('?sort=none');
			expect(result.current.state.sorting).toEqual([]);
		});

		it('joins facet values with a semicolon', () => {
			const { result } = setup();

			act(() =>
				result.current.state.onColumnFiltersChange([
					{ id: 'state', value: ['open', 'closed'] }
				])
			);

			expect(pairs(result.current.search)).toEqual(['state=open;closed']);
			expect(result.current.state.hasFilters).toBe(true);
		});

		it('reads a semicolon-joined facet back out of the URL', () => {
			const { result } = setup('/issues?category=env;flaky');

			expect(result.current.state.columnFilters).toEqual([
				{ id: 'category', value: ['env', 'flaky'] }
			]);
		});

		it('returns to page 1 when a facet or the search box narrows the list', () => {
			const { result } = setup('/issues?page=4');

			act(() => result.current.state.setSearch('timeout'));

			expect(pairs(result.current.search)).toEqual(['q=timeout']);
		});

		it('returns to page 1 when the page size changes', () => {
			const { result } = setup('/issues?page=4');

			act(() =>
				result.current.state.onPaginationChange({ pageIndex: 3, pageSize: 50 })
			);

			expect(pairs(result.current.search)).toEqual(['pageSize=50']);
		});

		it('clears facets, search and page but keeps sort and pageSize', () => {
			const { result } = setup(
				'/issues?page=3&pageSize=50&sort=title:asc&state=open&q=timeout'
			);

			act(() => result.current.state.resetFilters());

			expect(pairs(result.current.search)).toEqual([
				'pageSize=50',
				'sort=title:asc'
			]);
		});
	});

	describe('writes merge rather than rebuild', () => {
		it('preserves a repeated project param through every kind of write', () => {
			const { result } = setup('/issues?project=1&project=2');

			act(() =>
				result.current.state.onPaginationChange({ pageIndex: 1, pageSize: 25 })
			);
			expect(pairs(result.current.search)).toEqual([
				'page=2',
				'project=1',
				'project=2'
			]);

			act(() =>
				result.current.state.onSortingChange([{ id: 'title', desc: false }])
			);
			expect(pairs(result.current.search)).toContain('project=1');
			expect(pairs(result.current.search)).toContain('project=2');

			act(() =>
				result.current.state.onColumnFiltersChange([
					{ id: 'state', value: ['open'] }
				])
			);
			expect(pairs(result.current.search)).toEqual([
				'project=1',
				'project=2',
				'sort=title:asc',
				'state=open'
			]);

			act(() => result.current.state.resetFilters());
			expect(pairs(result.current.search)).toEqual([
				'project=1',
				'project=2',
				'sort=title:asc'
			]);
		});

		it('leaves unrelated params alone', () => {
			const { result } = setup('/issues?mode=default&_s=abc');

			act(() => result.current.state.setSearch('timeout'));

			expect(pairs(result.current.search)).toEqual([
				'_s=abc',
				'mode=default',
				'q=timeout'
			]);
		});
	});

	describe('clampPage', () => {
		it('pulls an out-of-range page back to the last one', () => {
			const { result } = setup('/issues?page=9');

			act(() => result.current.state.clampPage(4));

			expect(pairs(result.current.search)).toEqual(['page=4']);
		});

		it('leaves an in-range page alone', () => {
			const { result } = setup('/issues?page=2');

			act(() => result.current.state.clampPage(4));

			expect(pairs(result.current.search)).toEqual(['page=2']);
		});

		it('does nothing before the row count is known', () => {
			const { result } = setup('/issues?page=9');

			act(() => result.current.state.clampPage(0));

			expect(pairs(result.current.search)).toEqual(['page=9']);
		});
	});

	describe('queryArgs', () => {
		it('projects the URL state into the shape DRF takes', () => {
			const { result } = setup(
				'/issues?page=2&pageSize=50&sort=created:desc&state=open;closed&q=timeout'
			);

			expect(result.current.state.queryArgs).toEqual({
				page: 2,
				pageSize: 50,
				search: 'timeout',
				ordering: '-created',
				filters: { state: ['open', 'closed'] }
			});
		});

		it('omits the search and ordering it has nothing to say about', () => {
			const { result } = setup('/issues?sort=none');

			expect(result.current.state.queryArgs).toEqual({
				page: 1,
				pageSize: 25,
				search: undefined,
				ordering: undefined,
				filters: {}
			});
		});

		it('prefixes ascending orderings with nothing and descending with a dash', () => {
			const { result } = setup('/issues?sort=title:asc');

			expect(result.current.state.queryArgs.ordering).toBe('title');
		});
	});
});

const WIDE_DEFAULTS: VisibilityState = { active: false };
const COMPACT_DEFAULTS: VisibilityState = {
	active: false,
	tags: false,
	verdicts: false
};

function setupVisibility(
	defaults: VisibilityState = WIDE_DEFAULTS,
	initialEntry = '/rules'
) {
	return renderHook(
		({ defaults: current }: { defaults: VisibilityState }) => ({
			visibility: useColumnVisibility('spec', current, { queryKey: 'cols' }),
			search: useLocation().search
		}),
		{ wrapper: wrapperFor(initialEntry), initialProps: { defaults } }
	);
}

/** What the hook currently reports, and the setter that records a change. */
function readVisibility(result: {
	current: { visibility: ReturnType<typeof useColumnVisibility> };
}) {
	const [state, setState] = result.current.visibility;

	return { state, setState };
}

describe('useColumnVisibility', () => {
	beforeEach(() => localStorage.clear());

	describe('URL, then localStorage, then the default', () => {
		it('reports the defaults when neither layer has anything to say', () => {
			const { result } = setupVisibility();

			expect(readVisibility(result).state).toEqual({ active: false });
			expect(result.current.search).toBe('');
		});

		it('lets the URL override a default', () => {
			const { result } = setupVisibility(COMPACT_DEFAULTS, '/rules?cols=%2Btags');

			expect(readVisibility(result).state).toEqual({
				active: false,
				tags: true,
				verdicts: false
			});
		});

		it('falls back to localStorage when the URL carries no columns', () => {
			localStorage.setItem('bublik.columns.spec', JSON.stringify({ tags: false }));

			const { result } = setupVisibility();

			expect(readVisibility(result).state).toEqual({
				active: false,
				tags: false
			});
		});

		it('prefers the URL over localStorage', () => {
			localStorage.setItem('bublik.columns.spec', JSON.stringify({ tags: false }));

			const { result } = setupVisibility(WIDE_DEFAULTS, '/rules?cols=-verdicts');

			expect(readVisibility(result).state).toEqual({
				active: false,
				verdicts: false
			});
		});
	});

	describe('what a change records', () => {
		it('records nothing when the choice already matches the default', () => {
			const { result } = setupVisibility(COMPACT_DEFAULTS);

			act(() =>
				readVisibility(result).setState({ ...COMPACT_DEFAULTS, tags: false })
			);

			expect(result.current.search).toBe('');
			expect(localStorage.getItem('bublik.columns.spec')).toBe('{}');
		});

		it('records only the column that differs, to both layers', () => {
			const { result } = setupVisibility(COMPACT_DEFAULTS);

			act(() =>
				readVisibility(result).setState({ ...COMPACT_DEFAULTS, tags: true })
			);

			expect(result.current.search).toBe('?cols=%2Btags');
			expect(localStorage.getItem('bublik.columns.spec')).toBe(
				JSON.stringify({ tags: true })
			);
		});

		it('accepts an updater, the way the table hands one over', () => {
			const { result } = setupVisibility(WIDE_DEFAULTS);

			act(() =>
				readVisibility(result).setState((old) => ({ ...old, verdicts: false }))
			);

			expect(result.current.search).toBe('?cols=-verdicts');
		});
	});

	describe('a default that moves with the width', () => {
		it('keeps an explicit choice but lets an untouched column follow', () => {
			const { result, rerender } = setupVisibility(COMPACT_DEFAULTS);

			// Verdicts is switched on by hand while the table is compact; tags is
			// left alone, hidden by the compact default rather than by a choice.
			act(() =>
				readVisibility(result).setState({ ...COMPACT_DEFAULTS, verdicts: true })
			);

			expect(readVisibility(result).state.tags).toBe(false);
			expect(readVisibility(result).state.verdicts).toBe(true);

			// The table grows and the default stops hiding anything.
			rerender({ defaults: WIDE_DEFAULTS });

			expect(readVisibility(result).state.verdicts).toBe(true);
			expect(readVisibility(result).state.tags).toBeUndefined();
		});
	});
});
