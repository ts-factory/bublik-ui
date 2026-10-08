/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createMemoryHistory } from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';

import { config } from '@/bublik/config';

import { createAppRouter, type AppRouter } from './router';

async function routerAt(url: string) {
	const router = createAppRouter(
		createMemoryHistory({ initialEntries: [`${config.baseUrl}${url}`] })
	);

	// Follows a redirect thrown in `beforeLoad` before resolving.
	await router.load();

	return router;
}

function matched(router: AppRouter) {
	return router.state.matches.map((match) => match.routeId);
}

describe('createAppRouter', () => {
	// The route map, one row per page
	// route: the URL, the match chain the file routes produce for it, and the
	// path params the leaf route parses.
	describe('matches every page URL of the plan route map', () => {
		it.each([
			['/auth/login', ['/auth', '/auth/login'], {}],
			['/auth/forgot', ['/auth', '/auth/forgot'], {}],
			[
				'/auth/forgot_password/password_reset/7/tok',
				['/auth', '/auth/forgot_password/password_reset/$userId/$resetToken'],
				{ userId: '7', resetToken: 'tok' }
			],
			[
				'/auth/register/activate/7/tok/',
				['/auth', '/auth/register/activate/$userId/$token'],
				{ userId: '7', token: 'tok' }
			],
			['/dashboard', ['/_app', '/_app/dashboard'], {}],
			[
				'/chat',
				['/_app', '/_app/_protected', '/_app/_protected/chat/{-$threadId}'],
				{}
			],
			[
				'/chat/42',
				['/_app', '/_app/_protected', '/_app/_protected/chat/{-$threadId}'],
				{ threadId: '42' }
			],
			['/tools/packet-viewer', ['/_app', '/_app/tools/packet-viewer'], {}],
			['/history', ['/_app', '/_app/history/'], {}],
			['/history/v2', ['/_app', '/_app/history/v2'], {}],
			['/log/1', ['/_app', '/_app/log/$runId/'], { runId: '1' }],
			['/runs/1/report', ['/_app', '/_app/runs/$runId/report'], { runId: '1' }],
			['/runs/1/issues', ['/_app', '/_app/runs/$runId/issues'], { runId: '1' }],
			[
				'/runs/1/results/2/measurements',
				['/_app', '/_app/runs/$runId/results/$resultId/measurements'],
				{ runId: '1', resultId: '2' }
			],
			['/runs', ['/_app', '/_app/_runs', '/_app/_runs/runs'], {}],
			['/compare', ['/_app', '/_app/_runs', '/_app/_runs/compare'], {}],
			['/multiple', ['/_app', '/_app/_runs', '/_app/_runs/multiple'], {}],
			['/runs/1', ['/_app', '/_app/runs/$runId/'], { runId: '1' }],
			['/issues', ['/_app', '/_app/issues/'], {}],
			['/issues/rules', ['/_app', '/_app/issues/rules'], {}],
			['/issues/5', ['/_app', '/_app/issues/$issueId'], { issueId: '5' }],
			[
				'/issues/5/results',
				['/_app', '/_app/issues/$issueId_/results'],
				{ issueId: '5' }
			],
			['/admin', ['/_app', '/_app/admin', '/_app/admin/'], {}],
			['/admin/import', ['/_app', '/_app/admin', '/_app/admin/import'], {}],
			['/admin/flower', ['/_app', '/_app/admin', '/_app/admin/flower'], {}],
			[
				'/admin/users',
				[
					'/_app',
					'/_app/admin',
					'/_app/admin/_admin',
					'/_app/admin/_admin/users'
				],
				{}
			],
			[
				'/admin/analytics',
				[
					'/_app',
					'/_app/admin',
					'/_app/admin/_admin',
					'/_app/admin/_admin/analytics'
				],
				{}
			],
			['/admin/config', ['/_app', '/_app/admin', '/_app/admin/config'], {}],
			['/help/faq', ['/_app', '/_app/help/faq'], {}]
		])('%s', async (url, routeIds, params) => {
			const router = await routerAt(url);

			expect(matched(router)).toEqual(['__root__', ...routeIds]);
			expect(router.state.matches.at(-1)?.params).toEqual(params);
			expect(
				router.state.matches.every((match) => match.status === 'success')
			).toBe(true);
		});
	});

	describe('keeps a trailing slash on load', () => {
		it('for the report link the run page emits', async () => {
			const router = await routerAt('/runs/1/report/?config=2');

			expect(matched(router).at(-1)).toBe('/_app/runs/$runId/report');
			expect(router.state.location.href).toBe('/runs/1/report/?config=2');
		});

		it('for the activation route', async () => {
			const router = await routerAt('/auth/register/activate/7/tok/');

			expect(router.state.location.pathname).toBe(
				'/auth/register/activate/7/tok/'
			);
		});
	});

	describe('redirects, as the React Router redirect components do today', () => {
		it('sends / to /dashboard with the search kept and the hash dropped, replacing the entry', async () => {
			const router = await routerAt('/?project=1&project=2&_s=abc#top');

			expect(router.state.location.href).toBe(
				'/dashboard?project=1&project=2&_s=abc'
			);
			expect(matched(router).at(-1)).toBe('/_app/dashboard');
			expect(router.history.length).toBe(1);
		});

		it('sends the legacy /log/:runId/:old to /log/:runId with the tree mode set', async () => {
			const router = await routerAt('/log/1/old?focusId=3&mode=tree');

			expect(router.state.location.href).toBe(
				'/log/1?focusId=3&mode=treeAndinfoAndlog'
			);
			expect(matched(router).at(-1)).toBe('/_app/log/$runId/');
			expect(router.history.length).toBe(1);
		});

		it.each([
			['/admin/issues?project=1', '/issues?project=1'],
			[
				'/admin/issues/rules?project=1&_s=abc#h',
				'/issues/rules?project=1&_s=abc#h'
			],
			['/admin/issues/5?project=1', '/issues/5?project=1'],
			['/admin/issues/5/extra?project=1', '/issues/5/extra?project=1']
		])(
			'sends the old %s to the top-level issues page with search and hash verbatim',
			async (from, to) => {
				const router = await routerAt(from);

				expect(router.state.location.href).toBe(to);
				expect(router.history.length).toBe(1);
			}
		);
	});

	it.each([
		'/definitely-not-a-bublik-page?project=1',
		'/runs/1/garbage',
		'/admin/garbage',
		'/auth/garbage',
		'/help'
	])(
		'serves the unknown URL %s as not found inside the app shell without rewriting it',
		async (url) => {
			const router = await routerAt(url);

			expect(router.state.location.href).toBe(url);
			// The `$` splat under the app layout is React Router's `*` route: the
			// not-found page renders inside the shell, sidebar included.
			expect(matched(router)).toEqual(['__root__', '/_app', '/_app/$']);
		}
	);

	it('builds hrefs under the base URL', async () => {
		const router = await routerAt('/dashboard');

		expect(
			router.buildLocation({
				to: '/runs/$runId',
				params: { runId: '1' },
				search: { page: '2' }
			}).publicHref
		).toBe(`${config.baseUrl}/runs/1?page=2`);
	});
});
