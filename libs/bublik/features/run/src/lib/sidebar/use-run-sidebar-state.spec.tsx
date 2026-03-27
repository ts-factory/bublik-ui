/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect } from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useRunSidebarState } from './use-run-sidebar-state';

const setSearchParamsMock = vi.fn();
const locationState = { openUnexpected: true };

vi.mock('react-router-dom', async () => {
	const actual = await vi.importActual<typeof import('react-router-dom')>(
		'react-router-dom'
	);

	return {
		...actual,
		useLocation: () => ({ state: locationState }),
		useSearchParams: () => [new URLSearchParams(), setSearchParamsMock]
	};
});

vi.mock('@/services/bublik-api', () => ({
	useGetRunReportConfigsQuery: () => ({ data: undefined, isLoading: false })
}));

vi.mock('@/bublik/features/sidebar', () => ({
	RUN_SIDEBAR_KEYS: {
		LAST_DETAILS: 'sidebar.run.lastDetails',
		LAST_REPORT: 'sidebar.run.lastReport',
		LAST_MODE: 'sidebar.run.lastMode'
	},
	SHARED_SIDEBAR_KEYS: {
		CURRENT_RUN_ID: 'sidebar.currentRunId',
		LAST_RUN_RUN_ID: 'sidebar.lastRunRunId'
	},
	getSidebarStateString: () => null,
	setSidebarStateValue: (
		sidebarState: Record<string, string>,
		key: string,
		value: string | null | undefined
	) => {
		if (value === null || value === undefined) {
			delete sidebarState[key];
			return;
		}

		sidebarState[key] = value;
	},
	updateSidebarStateSearchParams: (
		current: URLSearchParams,
		updater: (sidebarState: Record<string, string>) => void
	) => {
		const next = new URLSearchParams(current);
		const previous = next.toString();
		const state: Record<string, string> = {};

		updater(state);
		next.set('_s', JSON.stringify(state));

		if (next.toString() === previous) {
			return null;
		}

		return next;
	},
	stripSidebarParamsFromUrl: (url: string) => url,
	extractRunIdFromUrl: () => '42'
}));

function HookRunner() {
	const { setLastVisited } = useRunSidebarState();

	useEffect(() => {
		setLastVisited('details', '/runs/42');
	}, [setLastVisited]);

	return null;
}

describe('useRunSidebarState', () => {
	beforeEach(() => {
		setSearchParamsMock.mockClear();
	});

	it('preserves navigation state while updating sidebar params', async () => {
		render(<HookRunner />);

		await waitFor(() => {
			expect(setSearchParamsMock).toHaveBeenCalledWith(expect.anything(), {
				replace: true,
				state: locationState
			});
		});
	});
});
