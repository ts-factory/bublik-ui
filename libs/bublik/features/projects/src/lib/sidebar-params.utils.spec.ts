/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { parseSearch, stringifySearch } from '@/router';
import { SIDEBAR_STATE_PARAM } from '@/shared/types';

import {
	mergeParamsWithSidebarState,
	mergeSearchWithSidebarState,
	resolveTargetWithSidebarState
} from './sidebar-params.utils';

const SIDEBAR_STATE_VALUE = 'compressedSidebarState';

describe('mergeParamsWithSidebarState', () => {
	it('preserves compact sidebar params and rewrites project params', () => {
		const targetParams = new URLSearchParams('mode=charts&project=1');
		const currentParams = new URLSearchParams(
			`project=2&${SIDEBAR_STATE_PARAM}=${SIDEBAR_STATE_VALUE}`
		);

		const result = mergeParamsWithSidebarState(targetParams, currentParams, [
			42
		]);

		expect(result.get('mode')).toBe('charts');
		expect(result.get('global.runs.lastMode')).toBeNull();
		expect(result.get(SIDEBAR_STATE_PARAM)).toBe(SIDEBAR_STATE_VALUE);
		expect(result.getAll('project')).toEqual(['42']);
	});
});

describe('resolveTargetWithSidebarState', () => {
	const current = {
		pathname: '/dashboard',
		search: `?project=2&${SIDEBAR_STATE_PARAM}=${SIDEBAR_STATE_VALUE}&hide-sidebar=1&mode=x`
	};

	it('resolves a string target with the sidebar state, hide-sidebar and projects merged in', () => {
		expect(
			resolveTargetWithSidebarState('/runs?mode=charts#details', current, [42])
		).toEqual({
			to: '/runs',
			search: {
				mode: 'charts',
				[SIDEBAR_STATE_PARAM]: SIDEBAR_STATE_VALUE,
				'hide-sidebar': '1',
				project: '42'
			},
			hash: 'details'
		});
	});

	it('resolves an object target the same way as its string form', () => {
		expect(
			resolveTargetWithSidebarState(
				{ pathname: '/runs', search: 'mode=charts', hash: '#details' },
				current,
				[42]
			)
		).toEqual(
			resolveTargetWithSidebarState('/runs?mode=charts#details', current, [42])
		);
	});

	it('keeps an explicit sidebar state on the target and writes every project', () => {
		expect(
			resolveTargetWithSidebarState(
				`/runs?${SIDEBAR_STATE_PARAM}=mine`,
				current,
				[1, 2]
			).search
		).toEqual({
			[SIDEBAR_STATE_PARAM]: 'mine',
			'hide-sidebar': '1',
			project: ['1', '2']
		});
	});

	it('keeps a relative pathname for the router to resolve', () => {
		expect(
			resolveTargetWithSidebarState('../runs?mode=charts#details', current, [])
				.to
		).toBe('../runs');
	});

	it('stays on the current pathname for a search-only target, without a hash', () => {
		expect(
			resolveTargetWithSidebarState({ search: '?page=2' }, current, [])
		).toEqual({
			to: '/dashboard',
			search: {
				page: '2',
				[SIDEBAR_STATE_PARAM]: SIDEBAR_STATE_VALUE,
				'hide-sidebar': '1'
			},
			hash: undefined
		});
	});
});

describe('mergeSearchWithSidebarState', () => {
	// target, current, projects: the typed merge must write, key for key, the
	// query string the URLSearchParams merge writes.
	it.each([
		['mode=charts', `${SIDEBAR_STATE_PARAM}=abc&project=2`, [42]],
		['mode=charts&project=1', `project=2&hide-sidebar=1&_s=abc`, [42, 43]],
		['', `hide-sidebar=1&${SIDEBAR_STATE_PARAM}=abc`, []],
		[`${SIDEBAR_STATE_PARAM}=mine&a=1`, `${SIDEBAR_STATE_PARAM}=abc`, [1]],
		['hide-sidebar=0', 'hide-sidebar=1&hide-sidebar=true', []],
		['a=1&b=2', 'hide-sidebar=1&hide-sidebar=true&_s=x&_s=y', [5]],
		['a=', 'c=3', []]
	])('%s over %s with %j', (target, current, projectIds) => {
		const expected = mergeParamsWithSidebarState(
			new URLSearchParams(target),
			new URLSearchParams(current),
			projectIds
		).toString();

		const typed = mergeSearchWithSidebarState(
			parseSearch(target),
			new URLSearchParams(current),
			projectIds
		);

		expect(stringifySearch(typed)).toBe(expected ? `?${expected}` : '');
	});

	it('appends the sidebar state after the target keys when the target leaves it undefined', () => {
		const typed = mergeSearchWithSidebarState(
			{ [SIDEBAR_STATE_PARAM]: undefined, page: 2 },
			new URLSearchParams(`${SIDEBAR_STATE_PARAM}=abc`),
			[7]
		);

		expect(stringifySearch(typed)).toBe(
			`?page=2&${SIDEBAR_STATE_PARAM}=abc&project=7`
		);
	});
});
