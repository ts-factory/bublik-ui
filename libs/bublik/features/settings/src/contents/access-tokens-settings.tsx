import { useAuth } from '@/bublik/features/auth';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';
import { requestLogin } from '@/services/bublik-api';
import {
	CreateTokenFormContainer,
	TokensTableContainer
} from '@/bublik/features/access-tokens';
import { SettingsPane } from '../components/settings-pane';
import { SettingsSection } from '../components/settings-section';

export function AccessTokensSettingsContent() {
	const { user } = useAuth();

	return (
		<SettingsPane
			header="Access tokens"
			description="Let agents, CI jobs and scripts call Bublik as you"
		>
			{user ? (
				<SettingsSection
					title="Your tokens"
					description="A token acts as you, with your permissions. Its value is shown once, when you create it."
					actions={<CreateTokenFormContainer />}
				>
					<TokensTableContainer />
				</SettingsSection>
			) : (
				<div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-slate-6 bg-slate-1 p-10 text-center">
					<Icon name="Profile" className="size-10 text-text-menu" />
					<div className="space-y-1">
						<h3 className="text-base font-semibold text-text-primary">
							Sign-in required
						</h3>
						<p className="text-sm text-text-menu max-w-sm">
							Sign in to issue and revoke your access tokens.
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
