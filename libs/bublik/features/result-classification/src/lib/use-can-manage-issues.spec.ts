/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { manageIssuesPermission } from './use-can-manage-issues';

describe('manageIssuesPermission', () => {
	it('lets an admin through with no explanation to show', () => {
		expect(manageIssuesPermission({ isAdmin: true, isLoading: false })).toEqual(
			{ canManage: true, reason: '' }
		);
	});

	/**
	 * The controls are disabled, never hidden. Hiding them makes the feature
	 * look absent — there is no way to tell "you may not do this" from "this
	 * does not exist" — so a non-admin must still get a control and a reason.
	 */
	it('gives a non-admin a reason rather than an empty toolbar', () => {
		const { canManage, reason } = manageIssuesPermission({
			isAdmin: false,
			isLoading: false
		});

		expect(canManage).toBe(false);
		expect(reason).toMatch(/admin/i);
	});

	// Every control on the page would otherwise flicker from enabled to
	// disabled and back as `useMeQuery` settles.
	it('does not disable anything while the user is still loading', () => {
		expect(manageIssuesPermission({ isAdmin: false, isLoading: true })).toEqual(
			{ canManage: true, reason: '' }
		);
	});
});
