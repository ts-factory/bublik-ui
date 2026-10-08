/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { matchPath } from './match-path';

// Expected values are React Router 6's `matchPath` results for the patterns
// the sidebar navs, the analytics tracker and the run-diff form use today.
describe('matchPath (react-router-dom shape)', () => {
	it('matches a static pattern exactly, trailing slash tolerated, case-insensitive', () => {
		expect(matchPath('/runs', '/runs')).toMatchObject({
			params: {},
			pathname: '/runs',
			pathnameBase: '/runs'
		});
		expect(matchPath('/runs', '/runs/')).toMatchObject({ pathname: '/runs/' });
		expect(matchPath('/runs', '/Runs')).not.toBeNull();
		expect(matchPath('/runs', '/runs/1')).toBeNull();
		expect(matchPath('/runs', '/dashboard')).toBeNull();
	});

	it('captures params, decoding %2F', () => {
		expect(matchPath('/issues/:issueId', '/issues/42')?.params).toEqual({
			issueId: '42'
		});
		expect(matchPath('/runs/:runId/issues', '/runs/7/issues')?.params).toEqual({
			runId: '7'
		});
		expect(
			matchPath(
				'/runs/:runId/results/:resultId/measurements',
				'/runs/1/results/2/measurements'
			)?.params
		).toEqual({ runId: '1', resultId: '2' });
		expect(matchPath('/v2/runs/:id', '/v2/runs/9')?.params).toEqual({
			id: '9'
		});
		expect(matchPath('/a/:x', '/a/b%2Fc')?.params).toEqual({ x: 'b/c' });
	});

	it('a dynamic pattern does not match a longer or shorter path when end is true', () => {
		expect(matchPath('/runs/:runId', '/runs/1/report')).toBeNull();
		expect(matchPath('/runs/:runId', '/runs')).toBeNull();
		expect(matchPath('/issues/:issueId', '/issues/rules')?.params).toEqual({
			issueId: 'rules'
		});
	});

	it('end: false matches a prefix at a segment boundary', () => {
		expect(matchPath({ path: '/help', end: false }, '/help/faq')).toMatchObject(
			{
				pathname: '/help',
				pathnameBase: '/help'
			}
		);
		expect(matchPath({ path: '/help', end: false }, '/helpful')).toBeNull();
		expect(matchPath({ path: '/help', end: false }, '/help')).not.toBeNull();
	});

	it('a splat captures the rest under *', () => {
		expect(matchPath('/admin/*', '/admin/issues/5')).toMatchObject({
			params: { '*': 'issues/5' },
			pathname: '/admin/issues/5',
			pathnameBase: '/admin'
		});
		expect(matchPath('/admin/*', '/admin')?.params).toEqual({ '*': '' });
		expect(matchPath('/admin/*', '/administrator')).toBeNull();
	});

	it('caseSensitive: true distinguishes case', () => {
		expect(
			matchPath({ path: '/runs', caseSensitive: true }, '/Runs')
		).toBeNull();
	});

	it('returns the pattern it matched with', () => {
		expect(matchPath('/runs', '/runs')?.pattern).toEqual({
			path: '/runs',
			caseSensitive: false,
			end: true
		});
	});
});
