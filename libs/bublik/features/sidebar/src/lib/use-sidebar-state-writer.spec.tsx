/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect } from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SHARED_SIDEBAR_KEYS } from './sidebar-state.constants';
import { useSidebarStateWriter } from './use-sidebar-state-writer';

const { navigateMock, locationState } = vi.hoisted(() => ({
	navigateMock: vi.fn(),
	locationState: { openUnexpected: true }
}));

vi.mock('react-router-dom', () => ({
	useLocation: () => ({ state: locationState }),
	useNavigate: () => navigateMock
}));

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
	beforeEach(() => {
		navigateMock.mockClear();
		window.history.replaceState(
			null,
			'',
			'/v2/runs/42/report?config=7#memcached_requests_per_connection%3A1'
		);
	});

	it('preserves the report hash without resubmitting the router basename', async () => {
		render(<HookRunner />);

		await waitFor(() => {
			expect(navigateMock).toHaveBeenCalledWith(
				{
					search: expect.stringMatching(/(^|&)config=7(&|$)/),
					hash: '#memcached_requests_per_connection%3A1'
				},
				{
					replace: true,
					state: locationState
				}
			);
		});

		const [{ search }] = navigateMock.mock.calls[0];
		expect(new URLSearchParams(search).has('_s')).toBe(true);
	});
});
