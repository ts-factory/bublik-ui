/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	HistoryPreferencesForm,
	LogPreferencesForm,
	RunsPreferencesForm
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
			<SettingsSection
				title="Runs"
				description="Configure runs page filtering behavior"
			>
				<RunsPreferencesForm />
			</SettingsSection>
		</SettingsPane>
	);
}
