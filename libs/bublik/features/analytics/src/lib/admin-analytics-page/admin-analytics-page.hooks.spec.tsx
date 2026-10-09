/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { defineSearch, passthrough } from '@/router';
import { renderHookWithRouter } from '@/router/testing';

import {
	useAnalyticsQueryState,
	useAnalyticsSearchWriter
} from './admin-analytics-page.hooks';
import {
	clearFilterChanges,
	filterValuesChanges,
	queryValueChanges
} from './admin-analytics-page.utils';

/**
 * The route's schema (`apps/bublik/src/routes/-search/admin-analytics.search.ts`),
 * which a lib cannot import.
 */
const analyticsSearch = defineSearch({
	page: passthrough(),
	page_size: passthrough(),
	event_type: passthrough(),
	event_name: passthrough(),
	path: passthrough(),
	anon_id: passthrough(),
	app_version: passthrough(),
	search: passthrough(),
	payload_search: passthrough()
});

function renderAt(search: string) {
	return renderHookWithRouter(
		() => ({
			queryState: useAnalyticsQueryState(),
			writeSearch: useAnalyticsSearchWriter()
		}),
		{
			path: '/admin/analytics',
			search,
			hash: 'top',
			state: { fromRun: true },
			route: { id: '/_app/admin/_admin/analytics', search: analyticsSearch }
		}
	);
}

describe('useAnalyticsQueryState', () => {
	it('parses the snake_case keys, first value of a repeated key', async () => {
		const { result } = await renderAt(
			'?event_type=page_view%3Bevent&event_type=x&path=%2Fdashboard&page_size=200&page=2&search=s'
		);

		expect(result.current.queryState).toEqual({
			eventTypes: ['page_view', 'event'],
			eventNames: [],
			paths: ['/dashboard'],
			anonIds: [],
			appVersions: [],
			search: 's',
			payloadSearch: undefined,
			page: 2,
			pageSize: 200
		});
	});

	it('reads an unusable page and page size as 1 and 100', async () => {
		const { result } = await renderAt('?page=x&page_size=7');

		expect(result.current.queryState).toMatchObject({ page: 1, pageSize: 100 });
	});
});

describe('useAnalyticsSearchWriter (setSearchParams: a push)', () => {
	it('pushes the changes, keeps the other keys and drops the hash and state', async () => {
		const { router, result } = await renderAt(
			'?page=3&event_type=a&_s=abc&page_size=200'
		);
		const length = router.history.length;

		await act(async () =>
			result.current.writeSearch(filterValuesChanges('event_type', ['x', 'y']))
		);

		expect(router.history.location.href).toBe(
			'/v2/admin/analytics?page=1&event_type=x%3By&_s=abc&page_size=200'
		);
		expect(router.history.length).toBe(length + 1);
		expect(router.history.location.state).not.toHaveProperty('fromRun');
	});

	it('appends a new key and the page reset in write order', async () => {
		const { router, result } = await renderAt('?_s=abc');

		await act(async () =>
			result.current.writeSearch({
				event_name: undefined,
				...filterValuesChanges('event_type', ['page_view']),
				...filterValuesChanges('path', ['/x'])
			})
		);

		expect(router.history.location.href).toBe(
			'/v2/admin/analytics?_s=abc&event_type=page_view&page=1&path=%2Fx'
		);
	});

	it('removes cleared values and every filter on clear', async () => {
		const { router, result } = await renderAt(
			'?search=s&payload_search=p&event_type=a&page=4'
		);

		await act(async () =>
			result.current.writeSearch(queryValueChanges('payload_search', ''))
		);
		expect(router.history.location.href).toBe(
			'/v2/admin/analytics?search=s&event_type=a&page=1'
		);

		await act(async () => result.current.writeSearch(clearFilterChanges()));
		expect(router.history.location.href).toBe('/v2/admin/analytics?page=1');
	});
});
