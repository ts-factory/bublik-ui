/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderHookWithRouter, type TestRouter } from '@/router/testing';
import { useIsLogLegacy, useLogPage } from '@/bublik/features/log';

import { logSearch } from '../../routes/-search/log.search';
import { useLegacyLogRedirect } from './log-page';

// The log page's route, with its own search schema: reads are typed and
// writes go through its codecs, as in the app.
const LOG_ROUTE = { id: '/_app/log/$runId/', search: logSearch };

function renderLogHook<Result>(hook: () => Result, search = '', hash = '') {
	return renderHookWithRouter(hook, {
		route: LOG_ROUTE,
		path: '/log/1',
		search,
		hash
	});
}

// The router scrolls the window once on load; jsdom has no `scrollTo`.
beforeEach(() => {
	vi.stubGlobal('scrollTo', vi.fn());
});

afterEach(() => {
	vi.unstubAllGlobals();
});

const hrefOf = (router: TestRouter) => router.history.location.href;

async function back(router: TestRouter) {
	await act(async () => router.history.back());
}

describe('useLogPage', () => {
	it('reads runId and the typed log keys of the route', async () => {
		const { result } = await renderLogHook(
			useLogPage,
			'?focusId=7&page=2&lineNumber=7_14&mode=treeAndlog'
		);

		expect(result.current).toMatchObject({
			runId: 1,
			focusId: 7,
			isShowingRunLog: false,
			page: '2',
			lineNumber: '7_14',
			mode: 'treeAndlog'
		});
	});

	it('reads an absent focus as the run log, and an unknown mode raw', async () => {
		const { result } = await renderLogHook(useLogPage, '?mode=nope');

		expect(result.current).toMatchObject({
			focusId: null,
			isShowingRunLog: true,
			page: null,
			lineNumber: null,
			mode: 'nope'
		});
	});

	it('focuses a result with a push that drops the line and the page; Back restores them', async () => {
		const { router, result } = await renderLogHook(
			useLogPage,
			'?mode=treeAndlog&page=2&lineNumber=3_14&_s=abc'
		);

		await act(async () => result.current.setFocusId('9'));

		expect(hrefOf(router)).toBe('/v2/log/1?mode=treeAndlog&_s=abc&focusId=9');
		expect(router.history.length).toBe(2);

		await act(async () => result.current.setFocusId(12));

		expect(hrefOf(router)).toBe('/v2/log/1?mode=treeAndlog&_s=abc&focusId=12');
		expect(router.history.length).toBe(3);

		await back(router);
		expect(hrefOf(router)).toBe('/v2/log/1?mode=treeAndlog&_s=abc&focusId=9');
		await back(router);
		expect(hrefOf(router)).toBe(
			'/v2/log/1?mode=treeAndlog&page=2&lineNumber=3_14&_s=abc'
		);
	});

	it('keeps the position of a focusId already on the URL', async () => {
		const { router, result } = await renderLogHook(
			useLogPage,
			'?focusId=7&mode=treeAndlog&lineNumber=7_1'
		);

		await act(async () => result.current.setFocusId('8'));

		expect(hrefOf(router)).toBe('/v2/log/1?focusId=8&mode=treeAndlog');
	});

	it('"Run log" drops the focus, the line and the page with a push', async () => {
		const { router, result } = await renderLogHook(
			useLogPage,
			'?focusId=7&mode=infoAndlog&page=2&lineNumber=7_3&project=4'
		);

		await act(async () => result.current.showRunLog());

		expect(hrefOf(router)).toBe('/v2/log/1?mode=infoAndlog&project=4');
		expect(router.history.length).toBe(2);
	});

	it('drops the hash and location.state on a write, as setSearchParams did', async () => {
		const { router, result } = await renderHookWithRouter(useLogPage, {
			route: LOG_ROUTE,
			path: '/log/1',
			search: '?focusId=7',
			hash: 'top',
			state: { fromRun: true }
		});

		await act(async () => result.current.setFocusId('8'));

		expect(hrefOf(router)).toBe('/v2/log/1?focusId=8');
		expect(router.history.location.state).not.toHaveProperty('fromRun');
	});

	it('keeps a trailing slash in the pathname', async () => {
		const { router, result } = await renderHookWithRouter(useLogPage, {
			route: LOG_ROUTE,
			path: '/log/1/',
			search: '?mode=log'
		});

		await act(async () => result.current.setFocusId('8'));

		expect(hrefOf(router)).toBe('/v2/log/1/?mode=log&focusId=8');
	});

	describe('the pager', () => {
		it('deletes page one and the line, with a push', async () => {
			const { router, result } = await renderLogHook(
				useLogPage,
				'?focusId=7&page=2&lineNumber=7_3&mode=log'
			);

			await act(async () => result.current.setPage(1));

			expect(hrefOf(router)).toBe('/v2/log/1?focusId=7&mode=log');
			expect(router.history.length).toBe(2);
		});

		it('writes another page in place and drops the line', async () => {
			const { router, result } = await renderLogHook(
				useLogPage,
				'?focusId=7&page=2&lineNumber=7_3&mode=log'
			);

			await act(async () => result.current.setPage(3));

			expect(hrefOf(router)).toBe('/v2/log/1?focusId=7&page=3&mode=log');
		});

		it('writes page=0 for every page, appended', async () => {
			const { router, result } = await renderLogHook(
				useLogPage,
				'?focusId=7&mode=log'
			);

			await act(async () => result.current.setPage(0));

			expect(hrefOf(router)).toBe('/v2/log/1?focusId=7&mode=log&page=0');
			expect(result.current.page).toBe('0');
		});
	});

	it('bookmarks a line with a push, keeping the page', async () => {
		const { router, result } = await renderLogHook(
			useLogPage,
			'?focusId=7&page=2'
		);

		await act(async () => result.current.setLineNumber('7_14'));

		expect(hrefOf(router)).toBe('/v2/log/1?focusId=7&page=2&lineNumber=7_14');
		expect(router.history.length).toBe(2);

		await act(async () => result.current.setLineNumber('7_20'));

		expect(hrefOf(router)).toBe('/v2/log/1?focusId=7&page=2&lineNumber=7_20');
	});
});

describe('useIsLogLegacy', () => {
	it.each([
		['', false],
		['?legacy=true', true],
		['?legacy=false', false],
		['?experimental=false', true],
		['?experimental=true', false],
		['?legacy=false&experimental=false', true]
	])('%s reads as legacy: %s', async (search, isLegacyLog) => {
		const { result } = await renderLogHook(useIsLogLegacy, search);

		expect(result.current.isLegacyLog).toBe(isLegacyLog);
	});

	it('turns the legacy log on with a push, appending legacy=true', async () => {
		const { router, result } = await renderLogHook(
			useIsLogLegacy,
			'?focusId=7&mode=log'
		);

		await act(async () => result.current.toggleLog());

		expect(hrefOf(router)).toBe('/v2/log/1?focusId=7&mode=log&legacy=true');
		expect(router.history.length).toBe(2);

		await act(async () => result.current.toggleLog());

		expect(hrefOf(router)).toBe('/v2/log/1?focusId=7&mode=log&legacy=false');
		expect(router.history.length).toBe(3);
	});

	it('turns the deprecated experimental=false off as legacy=false, dropping experimental', async () => {
		const { router, result } = await renderLogHook(
			useIsLogLegacy,
			'?experimental=false&focusId=7'
		);

		await act(async () => result.current.toggleLog());

		expect(hrefOf(router)).toBe('/v2/log/1?focusId=7&legacy=false');
	});
});

describe('useLegacyLogRedirect', () => {
	const PREFERENCES_KEY = 'user-preferences';

	function preferLegacyLog() {
		localStorage.setItem(
			PREFERENCES_KEY,
			JSON.stringify({ log: { preferLegacyLog: true } })
		);
	}

	afterEach(() => localStorage.removeItem(PREFERENCES_KEY));

	it('does nothing without the preference', async () => {
		const { router, result } = await renderLogHook(
			useLegacyLogRedirect,
			'?focusId=7'
		);

		expect(result.current.shouldRedirect).toBe(false);
		expect(hrefOf(router)).toBe('/v2/log/1?focusId=7');
	});

	it('pushes a link that names no renderer to legacy=true, dropping experimental and the hash', async () => {
		preferLegacyLog();

		const { router } = await renderLogHook(
			useLegacyLogRedirect,
			'?experimental=true&focusId=7&mode=log',
			'top'
		);

		await waitFor(() =>
			expect(hrefOf(router)).toBe('/v2/log/1?focusId=7&mode=log&legacy=true')
		);
		expect(router.history.length).toBe(2);
	});

	it('leaves a link that names the JSON renderer alone', async () => {
		preferLegacyLog();

		const { router, result } = await renderLogHook(
			useLegacyLogRedirect,
			'?legacy=false&focusId=7'
		);

		expect(result.current.shouldRedirect).toBe(false);
		expect(hrefOf(router)).toBe('/v2/log/1?legacy=false&focusId=7');
		expect(router.history.length).toBe(1);
	});
});
