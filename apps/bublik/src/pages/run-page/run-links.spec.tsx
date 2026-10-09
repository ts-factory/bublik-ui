/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { routes } from '@/router';
import { renderWithRouter } from '@/router/testing';
import { RunDataResults } from '@/shared/types';
import { TooltipProvider } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
import { ResultLinks } from '@/bublik/features/result-links';
import { RunReportConfigLink } from '@/bublik/features/run-report';

import { runSearch } from '../../routes/-search/run.search';
import { RunLogLink } from './run-page';

// The result links render the history menu and the log preview, which fetch
// their data; only the links built here are under test.
vi.mock('@/bublik/features/history-link', () => ({
	HistoryLinkContainer: () => null
}));
vi.mock('@/bublik/features/log-preview-drawer', () => ({
	LogPreviewContainer: () => null
}));

const RUN_ROUTE = { id: '/_app/runs/$runId/', search: runSearch };

// The run page with table state, sidebar memory, hidden sidebar and two
// projects selected: every link carries `_s`, `hide-sidebar` and the projects
// into its target and drops the rest, as `LinkWithProject` does.
const CURRENT =
	'?expanded=N4IgDCBcAuBOCuBTAvkA&_s=abc&targetIterationId=11&hide-sidebar=1&project=3&project=4';
const CARRIED = '_s=abc&hide-sidebar=1&project=3&project=4';

function hrefOf(testId: string) {
	return screen.getByTestId(testId).getAttribute('href');
}

function anchorIn(testId: string) {
	return screen.getByTestId(testId).querySelector('a')?.getAttribute('href');
}

async function renderOnRunPage(ui: JSX.Element) {
	return renderWithRouter(<TooltipProvider>{ui}</TooltipProvider>, {
		route: RUN_ROUTE,
		path: '/runs/1',
		search: CURRENT
	});
}

beforeEach(() => {
	// The router scrolls the window once on load; jsdom has no `scrollTo`.
	vi.stubGlobal('scrollTo', vi.fn());
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('the run header links', () => {
	it('"Log" opens the log of the whole run in the full layout', async () => {
		await renderOnRunPage(
			<>
				<div data-testid="typed">
					<RunLogLink runId={1} />
				</div>
				<LinkWithProject data-testid="string" to={routes.log({ runId: '1' })} />
			</>
		);

		expect(anchorIn('typed')).toBe(
			`/v2/log/1?mode=treeAndinfoAndlog&${CARRIED}`
		);
		expect(anchorIn('typed')).toBe(hrefOf('string'));
	});

	it('a report opens the report page of its config, without a trailing slash', async () => {
		await renderOnRunPage(
			<>
				<RunReportConfigLink data-testid="typed" runId={1} configId={11}>
					Report
				</RunReportConfigLink>
				<LinkWithProject data-testid="string" to="/runs/1/report?config=11" />
			</>
		);

		expect(hrefOf('typed')).toBe(`/v2/runs/1/report?config=11&${CARRIED}`);
		expect(hrefOf('typed')).toBe(hrefOf('string'));
	});
});

describe('the result links', () => {
	const result = {
		name: 'test',
		has_measurements: true
	} as unknown as RunDataResults;

	it.each([
		['Run', 'Run 1', routes.run({ runId: '1', targetIterationId: 7 })],
		['Log', 'Log', routes.log({ runId: '1', focusId: 7 })],
		['Result', 'Result', routes.measurements({ runId: '1', resultId: 7 })]
	])('"%s" builds the link the routes.* builder did', async (_, name, to) => {
		await renderOnRunPage(
			<>
				<ResultLinks
					runId={1}
					resultId={7}
					result={result}
					hasMeasurements
					showLinkToRun
				/>
				<LinkWithProject data-testid="string" to={to} />
			</>
		);

		expect(screen.getByRole('link', { name }).getAttribute('href')).toBe(
			hrefOf('string')
		);
	});

	it('pins the wire strings: the run at the result, the focused log, the default measurements', async () => {
		await renderOnRunPage(
			<ResultLinks
				runId={1}
				resultId={7}
				result={result}
				hasMeasurements
				showLinkToRun
			/>
		);

		const hrefs = screen
			.getAllByRole('link')
			.map((link) => link.getAttribute('href'));

		expect(hrefs).toEqual([
			`/v2/runs/1?targetIterationId=7&${CARRIED}`,
			`/v2/log/1?focusId=7&mode=treeAndinfoAndlog&${CARRIED}`,
			`/v2/runs/1/results/7/measurements?mode=default&${CARRIED}`
		]);
	});
});
