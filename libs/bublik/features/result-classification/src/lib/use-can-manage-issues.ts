/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useAuth } from '@/bublik/features/auth';

export interface ManageIssuesPermission {
	canManage: boolean;
	/** Why not, for a tooltip. Empty when the controls are usable. */
	reason: string;
}

/**
 * Whether the current user may write issues and rules.
 *
 * Every mutation is `@check_action_permission('manage_issues')`, which resolves
 * to `auth_required(as_admin=True)`. The per-project exemption cannot reach it:
 * `per_conf.json` restricts `NOT_PERMISSION_REQUIRED_ACTIONS` to
 * `manage_test_comments` and `read_configs`. So this is admin or nothing.
 *
 * The controls are **shown and disabled** rather than hidden. Hiding them makes
 * the feature look absent — there is no way to tell "you cannot do this" from
 * "this does not exist" — and it is not what the rest of the feature does:
 * `ClassifyButton` renders for everyone and lets the server answer. A disabled
 * button with a reason is the version that teaches.
 *
 * While `useMeQuery` is in flight nothing is disabled: the wait is short, and
 * flickering every control on a page is worse than a click that briefly does
 * nothing.
 */
export function useCanManageIssues(): ManageIssuesPermission {
	const { isAdmin, isLoading } = useAuth();

	return manageIssuesPermission({ isAdmin, isLoading });
}

/** The decision, without the store — see the hook above for the reasoning. */
export function manageIssuesPermission({
	isAdmin,
	isLoading
}: {
	isAdmin: boolean;
	isLoading: boolean;
}): ManageIssuesPermission {
	const canManage = isAdmin || isLoading;

	return {
		canManage,
		reason: canManage
			? ''
			: 'Creating and editing issues requires an admin account'
	};
}
