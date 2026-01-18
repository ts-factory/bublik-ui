import { ReactNode } from 'react';

import type { SettingsTab } from './types';
import { AccountSettingsContent } from './contents/account-settings';
import { AppearanceSettingsContent } from './contents/appearance-settings';
import { BetaSettingsContent } from './contents/beta-settings';
import { VersionSettingsContent } from './contents/version-settings';
import { PreferencesSettingsContent } from './contents/preferences-settings';

export const SettingsContent: Record<SettingsTab, ReactNode> = {
	account: <AccountSettingsContent />,
	appearance: <AppearanceSettingsContent />,
	beta: <BetaSettingsContent />,
	version: <VersionSettingsContent />,
	preferences: <PreferencesSettingsContent />
};
