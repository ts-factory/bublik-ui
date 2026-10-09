/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { screen } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithRouter } from '@/router/testing';

import { measurementsSearch } from '@/shared/utils';
import { LinkToLog } from './link-to-log';
import { LinkToRun } from './link-to-run';

vi.mock('@/bublik/features/analytics', () => ({
	analyticsEventNames: {},
	trackEvent: vi.fn()
}));

vi.mock('@/shared/tailwind-ui', async (importOriginal) => ({
	...(await importOriginal<object>()),
	ButtonTw: ({ children }: { children: ReactNode }) => children,
	Icon: () => null
}));

const BASEPATH = '/v2';
const MEASUREMENTS_ROUTE_ID =
	'/_app/runs/$runId/results/$resultId/measurements';
const PAGE = '/runs/1/results/11/measurements';
// The keys every link carries over from the page on screen.
const CARRIED = '_s=abc&project=4';

async function renderOnPage(ui: ReactElement) {
	await renderWithRouter(ui, {
		route: { id: MEASUREMENTS_ROUTE_ID, search: measurementsSearch },
		path: PAGE,
		search: `?mode=split&selectedCharts=2&${CARRIED}`,
		hash: '#top'
	});

	return (name: string) =>
		screen.getByRole('link', { name }).getAttribute('href');
}

describe('the measurements header links', () => {
	it('opens the log focused on the result in the full layout', async () => {
		const hrefOf = await renderOnPage(<LinkToLog runId={1} resultId={11} />);

		expect(hrefOf('Log')).toBe(
			`${BASEPATH}/log/1?focusId=11&mode=treeAndinfoAndlog&${CARRIED}`
		);
	});

	it('opens the run targeting the result', async () => {
		const hrefOf = await renderOnPage(
			<LinkToRun runId={1} targetIterationId={11} />
		);

		expect(hrefOf('Run')).toBe(
			`${BASEPATH}/runs/1?targetIterationId=11&${CARRIED}`
		);
	});

	it('opens the run alone without a usable target', async () => {
		const hrefOf = await renderOnPage(
			<LinkToRun runId={1} targetIterationId={Number('x')} />
		);

		expect(hrefOf('Run')).toBe(`${BASEPATH}/runs/1?${CARRIED}`);
	});
});
