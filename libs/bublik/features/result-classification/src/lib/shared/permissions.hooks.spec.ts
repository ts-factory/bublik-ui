/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { manageIssuesPermission } from './permissions.hooks';

describe('manageIssuesPermission', () => {
	it('lets an admin through with no explanation to show', () => {
		expect(manageIssuesPermission({ isAdmin: true, isLoading: false })).toEqual(
			{ canManage: true, reason: '' }
		);
	});

	it('gives a non-admin a reason rather than an empty toolbar', () => {
		const { canManage, reason } = manageIssuesPermission({
			isAdmin: false,
			isLoading: false
		});

		expect(canManage).toBe(false);
		expect(reason).toMatch(/admin/i);
	});

	it('does not disable anything while the user is still loading', () => {
		expect(manageIssuesPermission({ isAdmin: false, isLoading: true })).toEqual(
			{ canManage: true, reason: '' }
		);
	});
});
