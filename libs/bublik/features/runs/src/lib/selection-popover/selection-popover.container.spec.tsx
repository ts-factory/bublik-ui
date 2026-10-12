/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
	RUNS_SIDEBAR_KEYS,
	updateSidebarStateSearchParams
} from '@/bublik/features/sidebar';
import { renderWithRouter } from '@/router/testing';
import { TooltipProvider } from '@/shared/tailwind-ui';

import { SelectionPopoverContainer } from './selection-popover.container';

vi.mock('@/services/bublik-api', async (importOriginal) => ({
	...(await importOriginal<typeof import('@/services/bublik-api')>()),
	useGetRunDetailsQuery: () => ({ isLoading: true })
}));

const LAST_LIST = '/runs?startDate=2026-04-20&finishDate=2026-04-20';

/** `_s` carrying `state`, as a query string. */
function sidebarState(state: Record<string, string | string[]>): string {
	return (
		updateSidebarStateSearchParams(new URLSearchParams(), (sidebar) => {
			Object.assign(sidebar, state);
		})?.toString() ?? ''
	);
}

const SELECTED_PAIR = sidebarState({
	[RUNS_SIDEBAR_KEYS.SELECTED]: ['1132', '1151'],
	[RUNS_SIDEBAR_KEYS.LAST_LIST]: LAST_LIST
});

async function openPopoverAt(path: string, search: string) {
	const user = userEvent.setup();
	const rendered = await renderWithRouter(
		<TooltipProvider>
			<SelectionPopoverContainer />
		</TooltipProvider>,
		{ path, search }
	);

	await user.click(screen.getByRole('button', { name: /2 runs selected/ }));

	return { ...rendered, user, length: rendered.router.history.length };
}

describe('<SelectionPopoverContainer />', () => {
	beforeEach(() => localStorage.clear());

	it('links the pair to /compare and /multiple, carrying the sidebar state and projects', async () => {
		await openPopoverAt('/runs', `mode=table&${SELECTED_PAIR}&project=7`);

		expect(
			screen.getByRole('link', { name: /Compare/ }).getAttribute('href')
		).toBe(`/v2/compare?left=1132&right=1151&${SELECTED_PAIR}&project=7`);
		expect(
			screen.getByRole('link', { name: /Multiple/ }).getAttribute('href')
		).toBe(`/v2/multiple?runIds=1132&runIds=1151&${SELECTED_PAIR}&project=7`);
	});

	it('clears the selection in place on the runs list', async () => {
		const { router, user, length } = await openPopoverAt(
			'/runs',
			`mode=table&${SELECTED_PAIR}`
		);

		await user.click(screen.getByRole('button', { name: 'Reset' }));

		await waitFor(() =>
			expect(router.history.location.href).toBe(
				`/v2/runs?mode=table&${sidebarState({
					[RUNS_SIDEBAR_KEYS.LAST_LIST]: LAST_LIST
				})}`
			)
		);
		expect(router.history.length).toBe(length);
	});

	it('goes back to the last runs list, replacing /compare, once the selection is cleared there', async () => {
		const { router, user, length } = await openPopoverAt(
			'/compare',
			`left=1132&right=1151&${SELECTED_PAIR}&project=7`
		);

		await user.click(screen.getByRole('button', { name: 'Reset' }));

		await waitFor(() =>
			expect(router.history.location.href).toBe(
				`/v2${LAST_LIST}&${sidebarState({
					[RUNS_SIDEBAR_KEYS.LAST_LIST]: LAST_LIST
				})}&project=7`
			)
		);
		expect(router.history.length).toBe(length);
	});
});
