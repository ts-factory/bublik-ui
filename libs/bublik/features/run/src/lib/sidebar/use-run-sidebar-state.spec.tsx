/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect } from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useRunSidebarState } from './use-run-sidebar-state';

const setSearchParamsMock = vi.fn();
const locationState = { openUnexpected: true };

// Values returned by the mocked getSidebarStateString, keyed by sidebar key.
// Tests mutate this to simulate different `_s` contents.
const sidebarStateValues: Record<string, string | null> = {};

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
		CURRENT_RUN_ID: 'sidebar.currentRunId'
	},
	getSidebarStateString: (_params: URLSearchParams, key: string) =>
		sidebarStateValues[key] ?? null,
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
	useSidebarStateWriter:
		() => (updater: (sidebarState: Record<string, string>) => void) => {
			const next = new URLSearchParams(window.location.search);
			const previous = next.toString();
			const state: Record<string, string> = {};

			updater(state);
			next.set('_s', JSON.stringify(state));

			if (next.toString() === previous) {
				return;
			}

			setSearchParamsMock(next, { replace: true, state: locationState });
		},
	stripSidebarParamsFromUrl: (url: string) => url,
	extractRunIdFromUrl: () => '42',
	RUN_MODE_DEFAULT: 'details',
	getRunDetailsDefaultUrl: (runId: string) => `/runs/${runId}`
}));

function HookRunner() {
	const { setLastVisited } = useRunSidebarState();

	useEffect(() => {
		setLastVisited('details', '/runs/42');
	}, [setLastVisited]);

	return null;
}

function AvailabilityRunner({
	onState
}: {
	onState: (isDetailsAvailable: boolean) => void;
}) {
	const { isDetailsAvailable } = useRunSidebarState();

	onState(isDetailsAvailable);

	return null;
}

describe('useRunSidebarState', () => {
	beforeEach(() => {
		setSearchParamsMock.mockClear();
		for (const key of Object.keys(sidebarStateValues)) {
			delete sidebarStateValues[key];
		}
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

	it('keeps details available when the cached URL is pruned but the run id survives', () => {
		// Simulates `lastDetails` dropped by prune while `cr` (currentRunId) remains.
		sidebarStateValues['sidebar.run.lastDetails'] = null;
		sidebarStateValues['sidebar.currentRunId'] = '42';

		let isDetailsAvailable = false;
		render(
			<AvailabilityRunner onState={(value) => (isDetailsAvailable = value)} />
		);

		expect(isDetailsAvailable).toBe(true);
	});

	it('marks details unavailable when neither cached URL nor run id is present', () => {
		let isDetailsAvailable = true;
		render(
			<AvailabilityRunner onState={(value) => (isDetailsAvailable = value)} />
		);

		expect(isDetailsAvailable).toBe(false);
	});
});
