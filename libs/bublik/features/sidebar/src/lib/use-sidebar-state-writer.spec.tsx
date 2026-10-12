/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect } from 'react';
import { waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithRouter } from '@/router/testing';

import { SHARED_SIDEBAR_KEYS } from './sidebar-state.constants';
import { getSidebarStateString } from './sidebar-url.utils';
import { useSidebarStateWriter } from './use-sidebar-state-writer';

function HookRunner() {
	const writeSidebarState = useSidebarStateWriter();

	useEffect(() => {
		writeSidebarState((sidebarState) => {
			sidebarState[SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID] = '42';
		});
	}, [writeSidebarState]);

	return null;
}

describe('useSidebarStateWriter', () => {
	it('preserves the report hash without resubmitting the router basename', async () => {
		const { router } = await renderWithRouter(<HookRunner />, {
			path: '/runs/42/report',
			search: 'config=7',
			hash: 'memcached_requests_per_connection%3A1',
			state: { openUnexpected: true }
		});

		await waitFor(() =>
			expect(router.history.location.search).toContain('_s=')
		);

		const { pathname, search, hash, state } = router.history.location;
		const params = new URLSearchParams(search);

		expect(pathname).toBe('/v2/runs/42/report');
		expect(params.get('config')).toBe('7');
		expect(
			getSidebarStateString(params, SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID)
		).toBe('42');
		expect(hash).toBe('#memcached_requests_per_connection%3A1');
		expect(state).toMatchObject({ openUnexpected: true });
		// A replace: no entry to go Back to
		expect(router.history.length).toBe(1);
	});
});
