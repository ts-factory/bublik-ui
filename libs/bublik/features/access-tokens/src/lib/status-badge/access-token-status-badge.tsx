/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { AccessTokenStatus } from '@/shared/types';
import { Badge, BadgeVariants } from '@/shared/tailwind-ui';

/**
 * The fills the users table draws its account statuses with; the text stays
 * plain ink, so a column of statuses reads as data rather than alarms.
 */
const STATUS_VARIANTS: Record<AccessTokenStatus, BadgeVariants> = {
	active: BadgeVariants.Expected,
	expired: BadgeVariants.Neutral,
	revoked: BadgeVariants.Unexpected
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
		<Badge variant={STATUS_VARIANTS[status]} className="text-text-primary">
			{STATUS_LABELS[status]}
		</Badge>
	);
};
