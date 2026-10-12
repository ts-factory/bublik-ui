/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	afterAll,
	afterEach,
	beforeAll,
	describe,
	expect,
	it,
	vi
} from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactElement } from 'react';

import { renderWithRouter } from '@/router/testing';
import { TooltipProvider } from '@/shared/tailwind-ui';

import { CellLink } from './cell-link.component';

vi.mock('@/bublik/features/analytics', () => ({
	analyticsEventNames: {},
	trackEvent: vi.fn()
}));

/** The dashboard with a project selected and a sidebar state, as a shared link has. */
const DASHBOARD = {
	path: '/dashboard',
	search: '?main=2026-04-20&_s=abc&project=3'
};

function render(ui: ReactElement) {
	return renderWithRouter(
		<TooltipProvider delayDuration={0}>{ui}</TooltipProvider>,
		DASHBOARD
	);
}

describe('<CellLink />', () => {
	beforeAll(() => {
		vi.stubGlobal(
			'ResizeObserver',
			class {
				observe() {
					return undefined;
				}

				unobserve() {
					return undefined;
				}

				disconnect() {
					return undefined;
				}
			}
		);
	});

	afterAll(() => {
		vi.unstubAllGlobals();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('shows destination hint from payload context on hover', async () => {
		const user = userEvent.setup();

		await render(
			<CellLink
				cellKey="total"
				data={{
					value: '7610',
					payload: { url: 'tree', params: 42 }
				}}
				hint="go to run tests as a tree with its logs and context"
			/>
		);

		await user.hover(screen.getByRole('link', { name: '7610' }));

		expect(await screen.findByRole('tooltip')).toHaveTextContent(
			'go to run tests as a tree with its logs and context'
		);
	});

	it('does not map destination hint when backend hint is missing', async () => {
		const user = userEvent.setup();

		await render(
			<CellLink
				cellKey="configuration"
				data={{
					value: '7610',
					payload: { url: 'runs', params: 42 }
				}}
			/>
		);

		await user.hover(screen.getByRole('link', { name: '7610' }));

		expect(screen.queryByText('go to run details')).not.toBeInTheDocument();
		expect(
			screen.queryByText('go to run tests as a tree with its logs and context')
		).not.toBeInTheDocument();
	});

	// The wire strings of the cell links: the handler's own query
	// first, then the sidebar state and the selected projects of the page.
	it.each([
		['tree', '/v2/log/42?mode=treeAndinfoAndlog&_s=abc&project=3'],
		['runs', '/v2/runs/42?_s=abc&project=3'],
		['runs', '/v2/runs/42?_s=abc&project=3', '42'],
		// An id the route would rewrite keeps its bytes, as before
		['runs', '/v2/runs/042?_s=abc&project=3', '042'],
		['tree', '/v2/log/042?mode=treeAndinfoAndlog&_s=abc&project=3', '042'],
		['history', '/v2/history/42?_s=abc&project=3', 42],
		// A run handler whose params carry the rest of the path and a query
		// (the report link the dashboard renders for a configured report).
		[
			'runs',
			'/v2/runs/42/report/?config=11&_s=abc&project=3',
			'42/report/?config=11'
		]
	])('links a %s cell to %s', async (url, href, params = 42) => {
		await render(
			<CellLink
				cellKey="total"
				data={{ value: '1', payload: { url, params } }}
			/>
		);

		expect(screen.getByRole('link', { name: '1' })).toHaveAttribute(
			'href',
			href
		);
	});

	it('follows a relative cell link as a push without state', async () => {
		const { router } = await render(
			<CellLink
				cellKey="total"
				data={{ value: '1', payload: { url: 'tree', params: 42 } }}
			/>
		);
		const { length } = router.history;

		await act(async () => {
			fireEvent.click(screen.getByRole('link', { name: '1' }));
		});

		await waitFor(() =>
			expect(router.history.location.pathname).toBe('/v2/log/42')
		);
		expect(router.history.location.search).toBe(
			'?mode=treeAndinfoAndlog&_s=abc&project=3'
		);
		expect(router.history.location.state.openUnexpected).toBeUndefined();
		expect(router.history.length).toBe(length + 1);
	});

	it('opens an absolute cell link in a new tab', async () => {
		await render(
			<CellLink
				cellKey="total"
				data={{
					value: '1',
					payload: { url: 'https://example.com/report' }
				}}
			/>
		);

		const link = screen.getByRole('link', { name: '1' });

		expect(link).toHaveAttribute('href', 'https://example.com/report');
		expect(link).toHaveAttribute('target', '_blank');
	});

	it('renders a cell without a handler as text', async () => {
		await render(<CellLink cellKey="total" data={{ value: '1' }} />);

		expect(screen.queryByRole('link')).not.toBeInTheDocument();
		expect(screen.getByText('1')).toBeInTheDocument();
	});

	describe('the NOK badge', () => {
		const nok = (
			<CellLink
				cellKey="unexpected"
				data={{ value: '31', payload: { url: 'runs', params: 42 } }}
			/>
		);

		it('links to the run with the selected projects and the sidebar state', async () => {
			await render(nok);

			expect(screen.getByRole('link', { name: '31' })).toHaveAttribute(
				'href',
				'/v2/runs/42?_s=abc&project=3'
			);
		});

		it.each([
			['a click', (link: HTMLElement) => fireEvent.click(link)],
			[
				'a context-menu click',
				(link: HTMLElement) => fireEvent.contextMenu(link)
			]
		])(
			'opens the run with the unexpected results previewed on %s',
			async (_, interact) => {
				const { router } = await render(nok);
				const { length } = router.history;

				await act(async () => {
					interact(screen.getByRole('link', { name: '31' }));
				});

				await waitFor(() =>
					expect(router.history.location.pathname).toBe('/v2/runs/42')
				);
				expect(router.history.location.search).toBe('?_s=abc&project=3');
				expect(router.history.location.state).toMatchObject({
					openUnexpected: true,
					openUnexpectedIntentId: expect.any(String)
				});
				expect(
					router.history.location.state.openUnexpectedResults
				).toBeUndefined();
				expect(router.history.length).toBe(length + 1);
			}
		);

		it.each([
			[
				'a ctrl-click',
				(link: HTMLElement) => fireEvent.click(link, { ctrlKey: true })
			],
			[
				'a ctrl context-menu click',
				(link: HTMLElement) => fireEvent.contextMenu(link, { ctrlKey: true })
			]
		])(
			'opens the run with the unexpected result tables expanded on %s',
			async (_, interact) => {
				const { router } = await render(nok);

				await act(async () => {
					interact(screen.getByRole('link', { name: '31' }));
				});

				await waitFor(() =>
					expect(router.history.location.pathname).toBe('/v2/runs/42')
				);
				expect(router.history.location.search).toBe('?_s=abc&project=3');
				expect(router.history.location.state).toMatchObject({
					openUnexpectedResults: true,
					openUnexpectedIntentId: expect.any(String)
				});
				expect(router.history.location.state.openUnexpected).toBeUndefined();
			}
		);

		it('gives every click a fresh intent id', async () => {
			const { router } = await render(nok);
			const link = screen.getByRole('link', { name: '31' });

			await act(async () => {
				fireEvent.click(link);
			});
			await waitFor(() =>
				expect(router.history.location.pathname).toBe('/v2/runs/42')
			);
			const first = router.history.location.state.openUnexpectedIntentId;

			await act(async () => {
				fireEvent.click(link);
			});
			await waitFor(() =>
				expect(router.history.location.state.openUnexpectedIntentId).not.toBe(
					first
				)
			);
		});
	});
});
