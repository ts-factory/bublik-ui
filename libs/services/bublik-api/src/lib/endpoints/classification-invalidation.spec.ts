/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { configureStore } from '@reduxjs/toolkit';
import { createApi } from '@reduxjs/toolkit/query';
import { describe, expect, it, vi } from 'vitest';

import { BUBLIK_API_REDUCER_PATH } from '../constants';
import { tagTypes } from '../tags';
import { classificationEndpoints } from './classification-endpoints';

/**
 * The classification endpoints on a store of their own, answered by a fake
 * base query that records every URL it is asked for.
 */
function setup() {
	const requested: string[] = [];
	const api = createApi({
		reducerPath: BUBLIK_API_REDUCER_PATH,
		baseQuery: async (args: { url: string }) => {
			requested.push(args.url);
			return { data: args.url.endsWith('/results/') ? { results: [] } : {} };
		},
		tagTypes,
		endpoints: () => ({})
	}).injectEndpoints(classificationEndpoints);

	const store = configureStore({
		reducer: { [api.reducerPath]: api.reducer },
		middleware: (getDefault) => getDefault().concat(api.middleware)
	});

	const timesRequested = (suffix: string) =>
		requested.filter((url) => url.endsWith(suffix)).length;

	return { api, store, timesRequested };
}

describe.each(['activateRules', 'deactivateRules'] as const)(
	'%s',
	(endpoint) => {
		it('refetches the issue, whose rule counts it changes', async () => {
			const { api, store, timesRequested } = setup();
			store.dispatch(api.endpoints.getIssue.initiate({ issueId: 7 }));
			await vi.waitFor(() => expect(timesRequested('/issues/7/')).toBe(1));

			await store.dispatch(api.endpoints[endpoint].initiate({ ids: [3] }));

			await vi.waitFor(() => expect(timesRequested('/issues/7/')).toBe(2));
		});

		it('refetches the issue results, whose suppression it changes', async () => {
			const { api, store, timesRequested } = setup();
			store.dispatch(api.endpoints.getIssueResults.initiate({ issueId: 7 }));
			await vi.waitFor(() => expect(timesRequested('/results/')).toBe(1));

			await store.dispatch(api.endpoints[endpoint].initiate({ ids: [3] }));

			await vi.waitFor(() => expect(timesRequested('/results/')).toBe(2));
		});
	}
);
