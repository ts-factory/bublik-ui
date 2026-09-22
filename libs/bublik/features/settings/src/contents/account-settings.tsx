import { useAuth } from '@/bublik/features/auth';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';
import { requestLogin } from '@/services/bublik-api';
import {
	EditUserProfileContainer,
	ChangePasswordFormContainer
} from '@/bublik/features/user-preferences';
import { SettingsPane } from '../components/settings-pane';
import { SettingsSection } from '../components/settings-section';

export function AccountSettingsContent() {
	const { user } = useAuth();

	return (
		<SettingsPane
			header="Account"
			description="Manage your profile and security settings"
		>
			{user ? (
				<div className="space-y-8">
					<SettingsSection
						title="Profile"
						description="Manage your first name and last name"
					>
						<EditUserProfileContainer />
					</SettingsSection>
					<SettingsSection
						title="Password"
						description="Change your account password"
					>
						<ChangePasswordFormContainer />
					</SettingsSection>
				</div>
			) : (
				<div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-slate-6 bg-slate-1 p-10 text-center">
					<Icon name="Profile" className="size-10 text-text-menu" />
					<div className="space-y-1">
						<h3 className="text-base font-semibold text-text-primary">
							Sign-in required
						</h3>
						<p className="text-sm text-text-menu max-w-sm">
							Sign in to manage your profile and security settings.
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
