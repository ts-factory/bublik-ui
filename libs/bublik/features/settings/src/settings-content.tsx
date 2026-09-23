import { ReactNode } from 'react';

import type { SettingsTab } from './types';
import { AccessTokensSettingsContent } from './contents/access-tokens-settings';
import { AccountSettingsContent } from './contents/account-settings';
import { AppearanceSettingsContent } from './contents/appearance-settings';
import { BetaSettingsContent } from './contents/beta-settings';
import { McpServersSettingsContent } from './contents/mcp-servers-settings';
import { PreferencesSettingsContent } from './contents/preferences-settings';

export const SettingsContent: Record<SettingsTab, ReactNode> = {
	account: <AccountSettingsContent />,
	appearance: <AppearanceSettingsContent />,
	beta: <BetaSettingsContent />,
	'mcp-servers': <McpServersSettingsContent />,
	preferences: <PreferencesSettingsContent />,
	tokens: <AccessTokensSettingsContent />
};
