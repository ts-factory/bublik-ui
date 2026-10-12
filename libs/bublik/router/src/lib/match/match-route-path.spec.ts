/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { matchPath } from './path-pattern';
import { matchRoutePath, type RoutePathPattern } from './match-route-path';

/**
 * Every pattern the sidebar navs and the analytics tracker matched with
 * React Router, next to the route path it is written as now: `:param` is `$param`, `end: false` and `/*` are `fuzzy: true`.
 */
const PATTERNS: [
	rr: string | { path: string; end: boolean },
	RoutePathPattern
][] = [
	['/dashboard', { to: '/dashboard' }],
	['/history', { to: '/history' }],
	['/runs', { to: '/runs' }],
	['/compare', { to: '/compare' }],
	['/multiple', { to: '/multiple' }],
	['/runs/:runId', { to: '/runs/$runId' }],
	['/runs/:runId/report', { to: '/runs/$runId/report' }],
	['/runs/:runId/issues', { to: '/runs/$runId/issues' }],
	[
		'/runs/:runId/results/:resultId/measurements',
		{ to: '/runs/$runId/results/$resultId/measurements' }
	],
	['/log/:runId', { to: '/log/$runId' }],
	['/log/:runId/:old', { to: '/log/$runId/$old' }],
	['/issues', { to: '/issues' }],
	['/issues/rules', { to: '/issues/rules' }],
	['/issues/:issueId', { to: '/issues/$issueId' }],
	['/chat', { to: '/chat' }],
	['/chat/:threadId', { to: '/chat/$threadId' }],
	[
		{ path: '/help', end: false },
		{ to: '/help', fuzzy: true }
	],
	['/help/faq', { to: '/help/faq' }],
	['/admin/*', { to: '/admin', fuzzy: true }],
	['/admin/config', { to: '/admin/config' }],
	['/admin/users', { to: '/admin/users' }],
	['/admin/import', { to: '/admin/import' }],
	['/admin/flower', { to: '/admin/flower' }],
	['/admin/analytics', { to: '/admin/analytics' }],
	[
		'/auth/forgot_password/password_reset/:userId/:resetToken',
		{ to: '/auth/forgot_password/password_reset/$userId/$resetToken' }
	],
	[
		'/auth/register/activate/:userId/:token',
		{ to: '/auth/register/activate/$userId/$token' }
	]
];

const PATHNAMES = [
	'/',
	'/dashboard',
	'/dashboard/',
	'/Dashboard',
	'/dashboardx',
	'/history',
	'/history/v2',
	'/runs',
	'/runs/',
	'/runs/1',
	'/runs/1/',
	'/runs/abc',
	'/runs/1/report',
	'/runs/1/issues',
	'/runs/1/results/2/measurements',
	'/runs/1/unknown',
	'/compare',
	'/multiple',
	'/log/5',
	'/log/5/',
	'/log/5/7',
	'/log/5/7/8',
	'/issues',
	'/issues/rules',
	'/issues/42',
	'/issues/a%2Fb',
	'/chat',
	'/chat/t-1',
	'/help',
	'/help/',
	'/help/faq',
	'/help/changelog',
	'/helpful',
	'/admin',
	'/admin/',
	'/admin/config',
	'/admin/users',
	'/admin/a/b',
	'/administer',
	'/auth/forgot_password/password_reset/1/tok',
	'/auth/register/activate/a/b/',
	'/auth/register/activate/a'
];

describe('matchRoutePath', () => {
	it.each(PATTERNS)(
		'%j matches the same pathnames as React Router did',
		(rr, pattern) => {
			for (const pathname of PATHNAMES) {
				const expected = matchPath(rr, pathname);
				const actual = matchRoutePath(pattern, pathname);
				// `/admin/*` also captured the rest as `*`; nobody read it.
				const { '*': _splat, ...params } = expected?.params ?? {};

				expect({ pathname, match: actual }).toEqual({
					pathname,
					match: expected ? params : false
				});
			}
		}
	);

	it('returns the params, decoded, keyed by their route names', () => {
		expect(
			matchRoutePath(
				{ to: '/runs/$runId/results/$resultId/measurements' },
				'/runs/1/results/2/measurements'
			)
		).toEqual({ runId: '1', resultId: '2' });
		expect(matchRoutePath({ to: '/issues/$issueId' }, '/issues/a%2Fb')).toEqual(
			{ issueId: 'a/b' }
		);
	});

	it('is false, not null, when nothing matches', () => {
		expect(matchRoutePath({ to: '/runs' }, '/dashboard')).toBe(false);
	});
});
