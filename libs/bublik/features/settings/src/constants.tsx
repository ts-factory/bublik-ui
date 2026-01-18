import { FlaskConical } from 'lucide-react';

import { Icon } from '@/shared/tailwind-ui';
import type { SettingsTabConfig } from './types';

export const SETTINGS_TABS: SettingsTabConfig[] = [
	{
		id: 'account',
		label: 'Account',
		icon: <Icon name="Profile" size={18} />,
		description: 'Manage your profile and security settings'
	},
	{
		id: 'appearance',
		label: 'Appearance',
		icon: <Icon name="Image" size={18} />,
		description: 'Customize the look and feel'
	},
	{
		id: 'preferences',
		label: 'Preferences',
		icon: <Icon name="SettingsSliders" size={18} />,
		description: 'Configure default behaviors'
	},
	{
		id: 'beta',
		label: 'Beta',
		icon: <FlaskConical className="size-[18px]" />,
		description: 'Enable experimental features'
	}
];

export const VERSION_TAB: SettingsTabConfig = {
	id: 'version',
	label: 'Version',
	icon: <Icon name="InformationCircleQuestionMark" size={18} />,
	description: 'Application version information'
};
