/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithRouter } from '@/router/testing';
import { useLogPage } from '@/bublik/features/log';

import { logSearch } from '../routes/-search/log.search';
import { IframeNavigationReporter } from './iframe-navigation-reporter';

const LOG_ROUTE = { id: '/_app/log/$runId/', search: logSearch };

/** The reporter on the log page, with the tree's focus and "Run log" writers. */
function LogPageWithReporter() {
	const { setFocusId, showRunLog } = useLogPage();

	return (
		<>
			<IframeNavigationReporter />
			<button onClick={() => setFocusId('12')}>focus</button>
			<button onClick={showRunLog}>run log</button>
		</>
	);
}

describe('IframeNavigationReporter', () => {
	const postMessage = vi.fn();

	beforeEach(() => {
		postMessage.mockClear();
		// The router scrolls the window once on load; jsdom has no `scrollTo`.
		vi.stubGlobal('scrollTo', vi.fn());
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	function embed() {
		vi.spyOn(window, 'parent', 'get').mockReturnValue({
			postMessage
		} as unknown as Window);
	}

	it('posts the basename-relative path, the query string and the focused result', async () => {
		embed();

		await renderWithRouter(<LogPageWithReporter />, {
			route: LOG_ROUTE,
			path: '/log/1',
			search: '?focusId=336&mode=treeAndlog'
		});

		expect(postMessage).toHaveBeenLastCalledWith(
			{
				type: 'bublik:navigation',
				path: '/log/1',
				search: '?focusId=336&mode=treeAndlog',
				focusId: 336
			},
			'*'
		);
	});

	it('posts again on every focus change, with focusId null for the run log', async () => {
		embed();

		await renderWithRouter(<LogPageWithReporter />, {
			route: LOG_ROUTE,
			path: '/log/1',
			search: '?mode=treeAndlog&lineNumber=3_14'
		});

		expect(postMessage).toHaveBeenLastCalledWith(
			{
				type: 'bublik:navigation',
				path: '/log/1',
				search: '?mode=treeAndlog&lineNumber=3_14',
				focusId: null
			},
			'*'
		);

		await act(async () => fireEvent.click(screen.getByText('focus')));

		expect(postMessage).toHaveBeenLastCalledWith(
			{
				type: 'bublik:navigation',
				path: '/log/1',
				search: '?mode=treeAndlog&focusId=12',
				focusId: 12
			},
			'*'
		);

		await act(async () => fireEvent.click(screen.getByText('run log')));

		expect(postMessage).toHaveBeenLastCalledWith(
			{
				type: 'bublik:navigation',
				path: '/log/1',
				search: '?mode=treeAndlog',
				focusId: null
			},
			'*'
		);
	});

	it('keeps a hand-typed query string as typed', async () => {
		embed();

		await renderWithRouter(<LogPageWithReporter />, {
			route: LOG_ROUTE,
			path: '/log/1',
			search: '?focusId=7&mode=a%20b'
		});

		expect(postMessage).toHaveBeenLastCalledWith(
			expect.objectContaining({ search: '?focusId=7&mode=a%20b', focusId: 7 }),
			'*'
		);
	});

	it('posts nothing when not embedded', async () => {
		await renderWithRouter(<LogPageWithReporter />, {
			route: LOG_ROUTE,
			path: '/log/1',
			search: '?focusId=7'
		});

		expect(postMessage).not.toHaveBeenCalled();
	});
});
