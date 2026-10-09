/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithRouter } from '@/router/testing';

import {
	RunReportTableOfContents,
	type TableOfContentsItem
} from './run-report.component';
import { RUN_REPORT_ROUTE_ID } from './run-report-route.hooks';
import { runReportSearch } from '@/shared/utils';

const CONTENTS: TableOfContentsItem[] = [
	{
		id: 'test-block-1',
		type: 'test-block',
		label: 'Test 1',
		children: [
			{
				id: 'arg-val-block 7',
				type: 'arg-val-block',
				label: 'Args 7',
				children: [
					{
						id: 'measurement-3',
						type: 'measurement-block',
						label: 'Measurement 3',
						children: [{ id: 'record-9', type: 'record-block', label: 'R 9' }]
					}
				]
			}
		]
	}
];

const SEARCH =
	'?config=11&isFullMode=0&selected-records=rec-1&project=3&_s=abc&hide-sidebar=1';

function renderToc(search = SEARCH) {
	return renderWithRouter(<RunReportTableOfContents contents={CONTENTS} />, {
		route: { id: RUN_REPORT_ROUTE_ID, search: runReportSearch },
		path: '/runs/7/report',
		search
	});
}

const linkTo = (label: string) =>
	screen.getByRole('link', { name: label }).getAttribute('href');

describe('the table of contents', () => {
	it('links each entry to its anchor on the config alone, keeping the sidebar keys and projects', async () => {
		await renderToc();

		expect(linkTo('Test 1')).toBe(
			'/v2/runs/7/report?config=11&_s=abc&hide-sidebar=1&project=3#test-block-1'
		);
		expect(linkTo('Args 7')).toBe(
			'/v2/runs/7/report?config=11&_s=abc&hide-sidebar=1&project=3#arg-val-block%207'
		);
	});

	it('pushes the anchor on click', async () => {
		const { router } = await renderToc();
		const length = router.history.length;

		await act(async () => {
			fireEvent.click(screen.getByRole('link', { name: 'Args 7' }));
		});

		await waitFor(() =>
			expect(router.history.location.href).toBe(
				'/v2/runs/7/report?config=11&_s=abc&hide-sidebar=1&project=3#arg-val-block%207'
			)
		);
		expect(router.history.length).toBe(length + 1);
	});

	it('opens test and argument values blocks by default, measurements collapsed', async () => {
		await renderToc();

		expect(screen.getByRole('link', { name: 'Measurement 3' })).toBeTruthy();
		expect(screen.queryByRole('link', { name: 'R 9' })).toBeNull();
	});

	it('records a collapsed block under its own key, in place', async () => {
		const { router } = await renderToc();
		const length = router.history.length;

		await act(async () => {
			fireEvent.click(screen.getByRole('button', { name: 'Toggle Test 1' }));
		});

		expect(router.history.location.href).toBe(
			`/v2/runs/7/report${SEARCH}&test-block-1=0`
		);
		expect(router.history.length).toBe(length);
		expect(screen.queryByRole('link', { name: 'Args 7' })).toBeNull();
	});

	it('records an expanded measurement as 1, and opens one a link pins', async () => {
		const { router } = await renderToc();

		await act(async () => {
			fireEvent.click(
				screen.getByRole('button', { name: 'Toggle Measurement 3' })
			);
		});

		expect(router.history.location.href).toBe(
			`/v2/runs/7/report${SEARCH}&measurement-3=1`
		);
		expect(screen.getByRole('link', { name: 'R 9' })).toBeTruthy();
	});

	it('opens a measurement block a shared link pins as open', async () => {
		await renderToc('?config=11&measurement-3=1');

		expect(screen.getByRole('link', { name: 'R 9' })).toBeTruthy();
	});
});
