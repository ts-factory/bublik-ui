/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { withIssue } from './history-link.utils';

describe('withIssue', () => {
	it('adds the issue filter and keeps the other params', () => {
		const link = withIssue(
			{
				to: '/history',
				search: { testName: 'foo', mode: 'linear' },
				state: { fromRun: false }
			},
			42
		);

		expect(link.to).toBe('/history');
		expect(link.search).toEqual({
			testName: 'foo',
			mode: 'linear',
			issue: '42'
		});
		expect(Object.keys(link.search)).toEqual(['testName', 'mode', 'issue']);
		expect(link.state).toEqual({ fromRun: false });
	});

	it('replaces an issue the link already carries, in its place', () => {
		const link = withIssue(
			{ to: '/history', search: { issue: '1', mode: 'tree' }, state: {} },
			7
		);

		expect(link.search).toEqual({ issue: '7', mode: 'tree' });
		expect(Object.keys(link.search)).toEqual(['issue', 'mode']);
	});
});
