import { useAuth } from '@/bublik/features/auth';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
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
							Login Required
						</h3>
						<p className="text-sm text-text-menu max-w-sm">
							Log in to manage your profile and security settings.
						</p>
					</div>
					<ButtonTw asChild variant="primary" size="md">
						<LinkWithProject
							to={{
								pathname: '/auth/login',
								search: `?redirect_url=${encodeURIComponent(
									window.location.href
								)}`
							}}
						>
							Login
						</LinkWithProject>
					</ButtonTw>
				</div>
			)}
		</SettingsPane>
	);
}
