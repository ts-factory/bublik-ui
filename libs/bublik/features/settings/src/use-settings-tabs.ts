/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { useMemo } from 'react';

import { useGetServerFeaturesQuery } from '@/services/bublik-api';

import { SETTINGS_TABS } from './constants';
import type { SettingsTabConfig } from './types';

/**
 * The tabs to offer. "MCP servers" appears only once the chat is on and an
 * administrator has allowed at least one host for users' own servers.
 */
export function useSettingsTabs(): SettingsTabConfig[] {
	const { data } = useGetServerFeaturesQuery();
	const mcpServersEnabled = Boolean(data?.user_mcp_servers_enabled);

	return useMemo(
		() =>
			SETTINGS_TABS.filter(
				(tab) => tab.id !== 'mcp-servers' || mcpServersEnabled
			),
		[mcpServersEnabled]
	);
}
