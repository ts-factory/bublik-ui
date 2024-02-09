/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { PropsWithChildren } from 'react';

import {
	ChangePasswordFormContainer,
	EditUserProfileContainer,
	UserPreferencesFormContainer
} from '@/bublik/features/user-preferences';

interface SettingsSectionProps {
	label: string;
}

const SettingsSection = (props: PropsWithChildren<SettingsSectionProps>) => {
	return (
		<div className="flex flex-col gap-6">
			<h2 className="text-2xl font-semibold leading-5">{props.label}</h2>
			{props.children}
		</div>
	);
};

export const SettingsProfilePage = () => {
	return (
		<div className="flex flex-col gap-8">
			<SettingsSection label="Profile">
				<EditUserProfileContainer />
			</SettingsSection>
			<SettingsSection label="Security">
				<div className="flex items-center gap-4">
					<ChangePasswordFormContainer />
				</div>
			</SettingsSection>
			<SettingsSection label="User Preferences">
				<UserPreferencesFormContainer />
			</SettingsSection>
		</div>
	);
};
