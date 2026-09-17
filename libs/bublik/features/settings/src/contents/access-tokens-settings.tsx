import { useAuth } from '@/bublik/features/auth';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';
import { requestLogin } from '@/services/bublik-api';
import { AccessTokensPanelContainer } from '@/bublik/features/access-tokens';
import { SettingsPane } from '../components/settings-pane';

export function AccessTokensSettingsContent() {
	const { user } = useAuth();

	return (
		<SettingsPane
			header="Access Tokens"
			description="Let agents, CI jobs and scripts call Bublik as you"
		>
			{user ? (
				<AccessTokensPanelContainer />
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
