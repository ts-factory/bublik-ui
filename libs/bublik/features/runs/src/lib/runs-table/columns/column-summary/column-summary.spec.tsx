/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithRouter } from '@/router/testing';

import { ColumnSummary } from './column-summary';

async function renderSummary() {
	const rendered = await renderWithRouter(
		<ColumnSummary
			runId={42}
			totalCount={10}
			totalPlannedPercentage={100}
			expectedCount={7}
			expectedPercentage={70}
			unexpectedCount={3}
			unexpectedPercentage={30}
		/>,
		{ path: '/runs', search: 'mode=table&_s=abc&project=7' }
	);

	return { ...rendered, length: rendered.router.history.length };
}

const badge = (label: string) =>
	screen.getByText(`${label}:`).closest('a') as HTMLAnchorElement;

describe('<ColumnSummary />', () => {
	it('links every badge to the run, carrying the sidebar state and projects', async () => {
		await renderSummary();

		for (const label of ['Total', 'OK', 'NOK']) {
			expect(badge(label).getAttribute('href')).toBe(
				'/v2/runs/42?_s=abc&project=7'
			);
		}
	});

	it('opens the run with the unexpected results previewed on a NOK click, instead of following the link', async () => {
		const { router, length } = await renderSummary();

		const event = new MouseEvent('click', { bubbles: true, cancelable: true });
		fireEvent(badge('NOK'), event);

		expect(event.defaultPrevented).toBe(true);
		await waitFor(() =>
			expect(router.history.location.pathname).toBe('/v2/runs/42')
		);
		expect(router.history.location.search).toBe('?_s=abc&project=7');
		expect(router.history.location.state).toMatchObject({
			openUnexpected: true,
			openUnexpectedIntentId: expect.any(String)
		});
		expect(router.history.location.state).not.toHaveProperty(
			'openUnexpectedResults'
		);
		expect(router.history.length).toBe(length + 1);
	});

	it('previews the unexpected results themselves on a ctrl-click', async () => {
		const { router } = await renderSummary();

		fireEvent.click(badge('NOK'), { ctrlKey: true });

		await waitFor(() =>
			expect(router.history.location.state).toMatchObject({
				openUnexpectedResults: true,
				openUnexpectedIntentId: expect.any(String)
			})
		);
		expect(router.history.location.state).not.toHaveProperty('openUnexpected');
	});

	it('opens the run the same way from the context menu', async () => {
		const { router } = await renderSummary();

		const event = new MouseEvent('contextmenu', {
			bubbles: true,
			cancelable: true
		});
		fireEvent(badge('NOK'), event);

		expect(event.defaultPrevented).toBe(true);
		await waitFor(() =>
			expect(router.history.location.state).toMatchObject({
				openUnexpected: true
			})
		);
	});

	it('mints a fresh intent id for every NOK click', async () => {
		const { router } = await renderSummary();

		fireEvent.click(badge('NOK'));
		await waitFor(() =>
			expect(router.history.location.pathname).toBe('/v2/runs/42')
		);
		const first = router.history.location.state.openUnexpectedIntentId;

		fireEvent.click(badge('NOK'));
		await waitFor(() =>
			expect(router.history.location.state.openUnexpectedIntentId).not.toBe(
				first
			)
		);
	});
});
