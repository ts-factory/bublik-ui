import { Icon } from '@/shared/tailwind-ui';
import { SettingsPane } from '../components/settings-pane';
import { SettingsComingSoon } from '../components/settings-coming-soon';

export function AppearanceSettingsContent() {
	return (
		<SettingsPane
			header="Appearance"
			description="Customize how the application looks"
		>
			<SettingsComingSoon
				icon={<Icon name="Image" className="size-10 text-text-menu" />}
				title="Appearance settings"
				description="Theme customization and display options will be available here."
			/>
		</SettingsPane>
	);
}
