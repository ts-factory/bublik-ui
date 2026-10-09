/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { routes } from '@/router';
import { renderWithRouter } from '@/router/testing';
import { MeasurementsMode } from '@/shared/types';
import { TooltipProvider } from '@/shared/tailwind-ui';
import { LinkToMeasurements, LinkToRun } from '@/bublik/features/log';
import { getPacketViewerSearch } from '@/bublik/features/log-artifacts';
import {
	LinkWithProject,
	TypedLinkWithProject
} from '@/bublik/features/projects';

import { logSearch } from '../../routes/-search/log.search';

const LOG_ROUTE = { id: '/_app/log/$runId/', search: logSearch };

// The log page with sidebar memory, hidden sidebar and two projects selected:
// every link carries `_s`, `hide-sidebar` and the projects into its target.
const CURRENT =
	'?focusId=7&_s=abc&mode=treeAndlog&hide-sidebar=1&project=3&project=4';
const CARRIED = '_s=abc&hide-sidebar=1&project=3&project=4';

function hrefOf(testId: string) {
	return screen.getByTestId(testId).getAttribute('href');
}

async function renderOnLogPage(ui: JSX.Element) {
	return renderWithRouter(<TooltipProvider>{ui}</TooltipProvider>, {
		route: LOG_ROUTE,
		path: '/log/1',
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

describe('the log page links', () => {
	it('"Run" opens the run at the focused result', async () => {
		await renderOnLogPage(
			<>
				<div data-testid="typed">
					<LinkToRun runId={1} targetIterationId={7} />
				</div>
				<LinkWithProject
					data-testid="string"
					to={routes.run({ runId: '1', targetIterationId: 7 })}
				/>
			</>
		);

		const typed = screen.getByTestId('typed').querySelector('a');

		expect(typed?.getAttribute('href')).toBe(
			`/v2/runs/1?targetIterationId=7&${CARRIED}`
		);
		expect(typed?.getAttribute('href')).toBe(hrefOf('string'));
	});

	it('"Run" opens the whole run when nothing is focused', async () => {
		await renderOnLogPage(
			<div data-testid="typed">
				<LinkToRun runId={1} targetIterationId={null} />
			</div>
		);

		expect(
			screen.getByTestId('typed').querySelector('a')?.getAttribute('href')
		).toBe(`/v2/runs/1?${CARRIED}`);
	});

	it('"Result" opens the measurements in the default mode', async () => {
		await renderOnLogPage(
			<>
				<div data-testid="typed">
					<LinkToMeasurements runId={1} resultId={7} state="default" />
				</div>
				<LinkWithProject
					data-testid="string"
					to={routes.measurements({
						runId: 1,
						resultId: '7',
						mode: MeasurementsMode.Default
					})}
				/>
			</>
		);

		const typed = screen.getByTestId('typed').querySelector('a');

		expect(typed?.getAttribute('href')).toBe(
			`/v2/runs/1/results/7/measurements?mode=default&${CARRIED}`
		);
		expect(typed?.getAttribute('href')).toBe(hrefOf('string'));
	});

	it.each([
		[
			'with both ids',
			{ uri: 'http://logs/c.pcap' },
			1,
			7,
			'fileUrl=http%3A%2F%2Flogs%2Fc.pcap&runId=1&resultId=7'
		],
		[
			'from the bundle path, without a result id',
			{ path: 'c.pcap' },
			1,
			undefined,
			'fileUrl=http%3A%2F%2Flogs%2Frun%2Fc.pcap'
		]
	])(
		'"View" opens a packet capture in the packet viewer %s',
		async (_, data, runId, resultId, search) => {
			await renderOnLogPage(
				<TypedLinkWithProject
					data-testid="typed"
					to="/tools/packet-viewer"
					search={getPacketViewerSearch(
						data,
						'http://logs/run',
						runId,
						resultId
					)}
					target="_blank"
				/>
			);

			expect(hrefOf('typed')).toBe(
				`/v2/tools/packet-viewer?${search}&${CARRIED}`
			);
		}
	);
});
