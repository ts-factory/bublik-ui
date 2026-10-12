/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithRouter } from '@/router/testing';

import { packetViewerSearch } from '../../routes/-search/packet-viewer.search';
import { NetPacketAnalyzerPage } from './net-packet-analyzer.page';

vi.mock('@/bublik/features/net-analysis', () => ({
	NetPacketAnalyserContainer: (props: Record<string, unknown>) => (
		<output aria-label="viewer">{JSON.stringify(props)}</output>
	)
}));

const FILE_URL = 'https://logs.example.invalid/e2e/run.pcap';

function renderAt(search: string) {
	return renderWithRouter(<NetPacketAnalyzerPage />, {
		path: '/tools/packet-viewer',
		search,
		route: { id: '/_app/tools/packet-viewer', search: packetViewerSearch }
	});
}

function viewerProps(): Record<string, unknown> {
	return JSON.parse(
		screen.getByRole('status', { name: 'viewer' }).textContent ?? ''
	);
}

describe('NetPacketAnalyzerPage', () => {
	it.each([
		['no parameters', ''],
		['a fileUrl that is not a URL', '?fileUrl=not-a-url'],
		[
			'a runId that is not a number',
			`?fileUrl=${encodeURIComponent(FILE_URL)}&runId=not-a-number`
		],
		[
			'a resultId that is not a number',
			`?fileUrl=${encodeURIComponent(FILE_URL)}&resultId=x1`
		]
	])('shows its own invalid parameters panel for %s', async (_, search) => {
		await renderAt(search);

		expect(screen.getByText('Invalid URL Parameters')).toBeTruthy();
		expect(screen.getByText('Show validation errors')).toBeTruthy();
		expect(screen.queryByRole('status', { name: 'viewer' })).toBeNull();
	});

	it('keeps a malformed fileUrl on the URL and reports it as an invalid url', async () => {
		const { router } = await renderAt('?fileUrl=not-a-url&runId=1');

		expect(router.history.location.search).toBe('?fileUrl=not-a-url&runId=1');
		expect(screen.getByText(/Invalid url/)).toBeTruthy();
	});

	it('hands the capture and the ids to the viewer', async () => {
		await renderAt(
			`?${new URLSearchParams({
				fileUrl: FILE_URL,
				runId: '12',
				resultId: '1'
			})}`
		);

		expect(screen.queryByText('Invalid URL Parameters')).toBeNull();
		expect(viewerProps()).toEqual({
			fileUrl: FILE_URL,
			runId: 12,
			resultId: 1
		});
	});

	it('opens the viewer without ids when only the capture is given', async () => {
		await renderAt(`?fileUrl=${encodeURIComponent(FILE_URL)}`);

		expect(viewerProps()).toEqual({ fileUrl: FILE_URL });
	});

	it('reads an empty runId as 0, as the coercing schema did on the raw string', async () => {
		await renderAt(`?fileUrl=${encodeURIComponent(FILE_URL)}&runId=`);

		expect(viewerProps()).toEqual({ fileUrl: FILE_URL, runId: 0 });
	});
});
