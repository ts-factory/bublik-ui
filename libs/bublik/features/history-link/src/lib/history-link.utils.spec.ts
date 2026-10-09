/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { withIssue } from './history-link.utils';

describe('withIssue', () => {
	it('adds the issue filter and keeps the other params', () => {
		const link = withIssue(
			{
				to: { pathname: '/history', search: 'testName=foo&mode=linear' },
				state: { fromRun: false }
			},
			42
		);

		expect(link.to).toEqual({
			pathname: '/history',
			search: 'testName=foo&mode=linear&issue=42'
		});
		expect(link.state).toEqual({ fromRun: false });
	});

	it('replaces an issue the link already carries', () => {
		const link = withIssue({ to: '/history?issue=1&mode=tree' }, 7);

		expect(link.to).toEqual({
			pathname: '/history',
			search: 'issue=7&mode=tree'
		});
	});
});
