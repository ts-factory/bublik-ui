/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import type { AuthenticatedUser } from '@/bublik/features/auth';

import { getUserLabel } from './user-label';

const user = (firstName: string, lastName: string): AuthenticatedUser => ({
	firstName,
	lastName,
	email: 'jane@example.com',
	isActive: true,
	roles: [],
	displayName: `${firstName} ${lastName}`
});

describe('getUserLabel', () => {
	it('shows the full name with the email as detail', () => {
		expect(getUserLabel(user('Jane', 'Doe'))).toEqual({
			name: 'Jane Doe',
			detail: 'jane@example.com'
		});
	});

	it('uses whichever name part is set', () => {
		expect(getUserLabel(user('Jane', '')).name).toBe('Jane');
	});

	it('falls back to the email when no name is set', () => {
		expect(getUserLabel(user('', ' '))).toEqual({ name: 'jane@example.com' });
	});
});
