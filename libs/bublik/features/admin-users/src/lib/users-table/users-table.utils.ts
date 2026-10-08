/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { User, UserStatus } from '@/shared/types';
import { BadgeVariants } from '@/shared/tailwind-ui';

export const getBadgeColorByRole = (role: User['roles']) => {
	const DEFAULT_COLOR = 'bg-badge-3';

	const roleToColorMap = new Map<User['roles'], string>([
		['admin', 'bg-badge-6'],
		['user', 'bg-badge-3']
	]);

	return roleToColorMap.get(role) || DEFAULT_COLOR;
};

export type StatusBadgeStyle = {
	variant: BadgeVariants;
	className?: string;
};

/**
 * Active users are good to go, deactivated ones are locked out, and
 * pending ones are still waiting to verify their email. There is no warning
 * badge variant, so pending gets the warning fill on top of the primary one.
 */
export const getBadgeStyleByStatus = (status: UserStatus): StatusBadgeStyle => {
	const statusToStyleMap = new Map<UserStatus, StatusBadgeStyle>([
		['active', { variant: BadgeVariants.Expected }],
		['deactivated', { variant: BadgeVariants.Unexpected }],
		[
			'pending',
			{ variant: BadgeVariants.Primary, className: 'bg-bg-fillWarning' }
		]
	]);

	return statusToStyleMap.get(status) ?? { variant: BadgeVariants.Primary };
};
