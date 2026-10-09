/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { render, screen } from '@testing-library/react';
import { RouterProvider } from '@tanstack/react-router';
import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { LinkWithProject } from '@/bublik/features/projects';
import { routes } from '@/router';

import {
	BASEPATH,
	createMeasurementsRouter
} from '../../../test/measurements-router';
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

const PAGE = '/runs/1/results/11/measurements';
// The keys every link carries over from the page on screen.
const CARRIED = '_s=abc&project=4';

async function renderOnPage(ui: ReactElement) {
	const router = createMeasurementsRouter({
		url: `${PAGE}?mode=split&selectedCharts=2&${CARRIED}#top`,
		page: ui
	});
	await router.load();
	render(<RouterProvider router={router} />);

	return (name: string) =>
		screen.getByRole('link', { name }).getAttribute('href');
}

describe('the measurements header links', () => {
	it('opens the log focused on the result in the full layout', async () => {
		const hrefOf = await renderOnPage(<LinkToLog runId="1" resultId="11" />);

		expect(hrefOf('Log')).toBe(
			`${BASEPATH}/log/1?focusId=11&mode=treeAndinfoAndlog&${CARRIED}`
		);
	});

	it('opens the run targeting the result', async () => {
		const hrefOf = await renderOnPage(
			<LinkToRun runId="1" targetIterationId={11} />
		);

		expect(hrefOf('Run')).toBe(
			`${BASEPATH}/runs/1?targetIterationId=11&${CARRIED}`
		);
	});

	it('opens the run alone without a usable target', async () => {
		const hrefOf = await renderOnPage(
			<LinkToRun runId="1" targetIterationId={Number('x')} />
		);

		expect(hrefOf('Run')).toBe(`${BASEPATH}/runs/1?${CARRIED}`);
	});
});

describe('routes.measurements, the link every other page uses', () => {
	it('always writes the default mode', async () => {
		expect(routes.measurements({ runId: '1', resultId: '11' })).toEqual({
			pathname: PAGE,
			search: 'mode=default',
			hash: undefined
		});

		const hrefOf = await renderOnPage(
			<LinkWithProject to={routes.measurements({ runId: '1', resultId: '11' })}>
				Result
			</LinkWithProject>
		);

		expect(hrefOf('Result')).toBe(`${BASEPATH}${PAGE}?mode=default&${CARRIED}`);
	});
});
