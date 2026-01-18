import { Icon } from '@/shared/tailwind-ui';
import { SettingsPane } from '../components/settings-pane';
import { SettingsComingSoon } from '../components/settings-coming-soon';

export function BetaSettingsContent() {
	return (
		<SettingsPane
			header="Beta"
			description="Experimental features and settings will be available here."
		>
			<SettingsComingSoon
				icon={<Icon name="Image" className="size-10 text-text-menu" />}
				title="Beta Settings"
				description="Experimental features and settings will be available here."
			/>
		</SettingsPane>
	);
}
