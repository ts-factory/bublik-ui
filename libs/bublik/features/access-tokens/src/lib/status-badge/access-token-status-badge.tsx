/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { AccessTokenStatus } from '@/shared/types';
import { cn } from '@/shared/tailwind-ui';

const STATUS_STYLES: Record<AccessTokenStatus, string> = {
	active: 'bg-badge-3 text-text-expected',
	expired: 'bg-badge-0 text-text-menu',
	revoked: 'bg-bg-fillError text-text-unexpected'
};

const STATUS_LABELS: Record<AccessTokenStatus, string> = {
	active: 'Active',
	expired: 'Expired',
	revoked: 'Revoked'
};

export interface AccessTokenStatusBadgeProps {
	status: AccessTokenStatus;
}

export const AccessTokenStatusBadge = ({
	status
}: AccessTokenStatusBadgeProps) => {
	return (
		<span
			className={cn(
				'inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold',
				STATUS_STYLES[status]
			)}
		>
			{STATUS_LABELS[status]}
		</span>
	);
};
