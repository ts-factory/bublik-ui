/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { AuthenticatedUser } from '@/bublik/features/auth';

interface UserLabel {
	/** Full name, or the email when the user has not set a name */
	name: string;
	/** The email, shown under the name only when a name is set */
	detail?: string;
}

function getUserLabel(user: AuthenticatedUser): UserLabel {
	const fullName = [user.firstName, user.lastName]
		.map((part) => part?.trim())
		.filter(Boolean)
		.join(' ');

	return fullName
		? { name: fullName, detail: user.email }
		: { name: user.email };
}

export { getUserLabel };
export type { UserLabel };
