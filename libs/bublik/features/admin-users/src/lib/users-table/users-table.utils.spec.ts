/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { BadgeVariants } from '@/shared/tailwind-ui';

import { getBadgeStyleByStatus } from './users-table.utils';

describe('getBadgeStyleByStatus', () => {
	it('marks active users as expected', () => {
		expect(getBadgeStyleByStatus('active')).toEqual({
			variant: BadgeVariants.Expected
		});
	});

	it('marks deactivated users as unexpected', () => {
		expect(getBadgeStyleByStatus('deactivated')).toEqual({
			variant: BadgeVariants.Unexpected
		});
	});

	it('marks pending users with the warning fill', () => {
		expect(getBadgeStyleByStatus('pending')).toEqual({
			variant: BadgeVariants.Primary,
			className: 'bg-bg-fillWarning'
		});
	});
});
