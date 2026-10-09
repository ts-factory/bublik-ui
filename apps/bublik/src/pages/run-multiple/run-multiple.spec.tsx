/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { routes } from '@/router';
import {
	renderHookWithRouter,
	renderWithRouter,
	type TestRouter
} from '@/router/testing';
import { LinkWithProject } from '@/bublik/features/projects';

import { multipleSearch } from '../../routes/-search/multiple.search';
import {
	RunDetailsHeaderLabel,
	RunMultipleNavigationLinks,
	useIsModeFull
} from './index';

const MULTIPLE_ROUTE = { id: '/_app/_runs/multiple', search: multipleSearch };

// Two pinned runs, the first selected, with table state, sidebar memory,
// hidden sidebar and two projects selected.
const EXPANDED = 'N4IgDCBcAuBOCuBTAvkA';
const CURRENT = `?runIds=1&runIds=2&_s=abc&selected=1&expanded=${EXPANDED}&hide-sidebar=1&project=3&project=4`;
const CARRIED = '_s=abc&hide-sidebar=1&project=3&project=4';

const hrefOf = (router: TestRouter) => router.history.location.href;

function renderOnMultiplePage(ui: JSX.Element, search = CURRENT) {
	return renderWithRouter(ui, {
		route: MULTIPLE_ROUTE,
		path: '/multiple',
		search
	});
}

beforeEach(() => {
	// The router scrolls the window once on load; jsdom has no `scrollTo`.
	vi.stubGlobal('scrollTo', vi.fn());
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('the multiple-runs header', () => {
	it('links each pinned run with every key kept, selected set in place and the projects last', async () => {
		await renderOnMultiplePage(
			<>
				<RunDetailsHeaderLabel />
				<LinkWithProject
					data-testid="string"
					to={{
						pathname: '/multiple',
						search: `runIds=1&runIds=2&_s=abc&selected=2&expanded=${EXPANDED}&hide-sidebar=1&project=3&project=4`
					}}
				/>
			</>
		);

		const run2 = screen.getByRole('link', { name: 'Run 2' });

		expect(run2.getAttribute('href')).toBe(
			`/v2/multiple?runIds=1&runIds=2&_s=abc&selected=2&expanded=${EXPANDED}&hide-sidebar=1&project=3&project=4`
		);
		expect(run2.getAttribute('href')).toBe(
			screen.getByTestId('string').getAttribute('href')
		);
		expect(
			screen.getByRole('link', { name: 'Run 1' }).getAttribute('href')
		).toBe(`/v2/multiple${CURRENT}`);
	});

	it('appends selected when the link names no selection', async () => {
		await renderOnMultiplePage(<RunDetailsHeaderLabel />, '?runIds=1&runIds=2');

		expect(
			screen.getByRole('link', { name: 'Run 2' }).getAttribute('href')
		).toBe('/v2/multiple?runIds=1&runIds=2&selected=2');
	});

	it('selecting a run replaces the entry', async () => {
		const { router } = await renderOnMultiplePage(<RunDetailsHeaderLabel />);

		fireEvent.click(screen.getByRole('link', { name: 'Run 2' }));

		await waitFor(() =>
			expect(hrefOf(router)).toBe(
				`/v2/multiple?runIds=1&runIds=2&_s=abc&selected=2&expanded=${EXPANDED}&hide-sidebar=1&project=3&project=4`
			)
		);
		expect(router.history.length).toBe(1);
	});

	it('links the selected run and its log as the routes.* builders did', async () => {
		await renderOnMultiplePage(
			<>
				<div data-testid="typed">
					<RunMultipleNavigationLinks runId={2} />
				</div>
				<LinkWithProject data-testid="run" to={routes.run({ runId: '2' })} />
				<LinkWithProject data-testid="log" to={routes.log({ runId: '2' })} />
			</>
		);

		const hrefs = Array.from(
			screen.getByTestId('typed').querySelectorAll('a')
		).map((link) => link.getAttribute('href'));

		expect(hrefs).toEqual([
			`/v2/runs/2?${CARRIED}`,
			`/v2/log/2?mode=treeAndinfoAndlog&${CARRIED}`
		]);
		expect(hrefs).toEqual([
			screen.getByTestId('run').getAttribute('href'),
			screen.getByTestId('log').getAttribute('href')
		]);
	});
});

describe('the run details mode (isModeFull)', () => {
	it('reads 1/0, compact when absent or unreadable', async () => {
		for (const [search, expected] of [
			['?runIds=1&isModeFull=1', true],
			['?runIds=1&isModeFull=0', false],
			['?runIds=1', false],
			['?runIds=1&isModeFull=true', false]
		] as const) {
			const { result, unmount } = await renderHookWithRouter(useIsModeFull, {
				route: MULTIPLE_ROUTE,
				path: '/multiple',
				search
			});

			expect(result.current[0]).toBe(expected);
			unmount();
		}
	});

	it('toggles with a replace that merges, the state kept', async () => {
		const { result, router } = await renderHookWithRouter(useIsModeFull, {
			route: MULTIPLE_ROUTE,
			path: '/multiple',
			search: '?runIds=1&runIds=2&_s=abc',
			state: { openUnexpected: true }
		});

		await act(async () => result.current[1](true));

		expect(hrefOf(router)).toBe(
			'/v2/multiple?runIds=1&runIds=2&_s=abc&isModeFull=1'
		);
		expect(result.current[0]).toBe(true);

		await act(async () => result.current[1](false));

		expect(hrefOf(router)).toBe(
			'/v2/multiple?runIds=1&runIds=2&_s=abc&isModeFull=0'
		);
		expect(router.history.length).toBe(1);
		expect(router.history.location.state).toMatchObject({
			openUnexpected: true
		});
	});
});
