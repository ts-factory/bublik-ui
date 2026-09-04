/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useAuth } from '@/bublik/features/auth';

export interface ManageIssuesPermission {
	canManage: boolean;
	reason: string;
}

export function useCanManageIssues(): ManageIssuesPermission {
	const { isAdmin, isLoading } = useAuth();

	return manageIssuesPermission({ isAdmin, isLoading });
}

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
