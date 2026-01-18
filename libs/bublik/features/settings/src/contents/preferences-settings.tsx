import {
	HistoryPreferencesForm,
	LogPreferencesForm
} from '@/bublik/features/user-preferences';
import { SettingsPane } from '../components/settings-pane';
import { SettingsSection } from '../components/settings-section';

export function PreferencesSettingsContent() {
	return (
		<SettingsPane
			header="Preferences"
			description="Configure default behaviors and page settings"
		>
			<SettingsSection
				title="History"
				description="Setup defaults for history page"
			>
				<HistoryPreferencesForm />
			</SettingsSection>
			<SettingsSection
				title="Logs"
				description="Configure log display preferences"
			>
				<LogPreferencesForm />
			</SettingsSection>
		</SettingsPane>
	);
}
