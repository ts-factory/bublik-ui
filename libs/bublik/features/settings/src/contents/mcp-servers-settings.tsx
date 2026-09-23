/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { useAuth } from '@/bublik/features/auth';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';
import { requestLogin } from '@/services/bublik-api';
import {
	CreateMcpServerContainer,
	McpServersTableContainer
} from '@/bublik/features/mcp-servers';
import { SettingsPane } from '../components/settings-pane';
import { SettingsSection } from '../components/settings-section';

export function McpServersSettingsContent() {
	const { user } = useAuth();

	return (
		<SettingsPane
			header="MCP servers"
			description="Give the AI assistant your own tools in your chats"
		>
			{user ? (
				<SettingsSection
					title="Your servers"
					description="Each server's tools are available to the assistant in your chats only. Header values are stored encrypted and never shown again."
					actions={<CreateMcpServerContainer />}
				>
					<McpServersTableContainer />
				</SettingsSection>
			) : (
				<div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-slate-6 bg-slate-1 p-10 text-center">
					<Icon name="Profile" className="size-10 text-text-menu" />
					<div className="space-y-1">
						<h3 className="text-base font-semibold text-text-primary">
							Sign-in required
						</h3>
						<p className="text-sm text-text-menu max-w-sm">
							Sign in to manage the MCP servers the assistant uses for you.
						</p>
					</div>
					<ButtonTw
						variant="primary"
						size="md"
						onClick={() => void requestLogin({ kind: 'manual' })}
					>
						Sign In
					</ButtonTw>
				</div>
			)}
		</SettingsPane>
	);
}
