/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ProfilePicture } from '@/shared/tailwind-ui';

export type UserProfileHeaderInfo = {
	displayName: string;
	roles: string[];
	avatarUrl?: string;
};

export const UserProfileInfoHeader = (props: UserProfileHeaderInfo) => {
	const { displayName, roles, avatarUrl = '#' } = props;

	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-4">
				<ProfilePicture imageUrl={avatarUrl} displayName={displayName} />
				<div className="flex flex-col">
					<h1 className="text-lg font-bold">{displayName}</h1>
					<p className="text-sm text-text-menu">You are {roles.join(', ')}</p>
				</div>
			</div>
		</div>
	);
};
