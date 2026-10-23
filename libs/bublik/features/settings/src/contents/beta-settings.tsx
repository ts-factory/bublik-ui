/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	FEATURE_FLAGS,
	FeatureFlagToggle
} from '@/bublik/features/feature-flags';

import { SettingsPane } from '../components/settings-pane';
import { SettingsSection } from '../components/settings-section';

export function BetaSettingsContent() {
	return (
		<SettingsPane
			header="Beta"
			description="Try features before they are finished"
		>
			<SettingsSection
				title="Experimental features"
				description="Saved in this browser. Switch a feature off to go back to the current behaviour."
			>
				<div className="flex flex-col gap-3">
					{FEATURE_FLAGS.map((flag) => (
						<FeatureFlagToggle key={flag.id} flag={flag} />
					))}
				</div>
			</SettingsSection>
		</SettingsPane>
	);
}
