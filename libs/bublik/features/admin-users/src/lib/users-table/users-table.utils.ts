/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { User } from '@/shared/types';

export const getBadgeColorByRole = (role: User['roles']) => {
	const DEFAULT_COLOR = 'bg-badge-3';

	const roleToColorMap = new Map<User['roles'], string>([
		['admin', 'bg-badge-6'],
		['user', 'bg-badge-3']
	]);

	return roleToColorMap.get(role) || DEFAULT_COLOR;
};
