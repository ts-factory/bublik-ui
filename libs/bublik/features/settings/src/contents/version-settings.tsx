import { DeployInfoContainer } from '@/bublik/features/deploy-info';
import { PerformanceListContainer } from '@/bublik/features/performance-check';
import { SettingsPane } from '../components/settings-pane';
import { SettingsSection } from '../components/settings-section';

export function VersionSettingsContent() {
	return (
		<SettingsPane
			header="Version"
			description="Application version information"
		>
			<div className="space-y-8">
				<SettingsSection
					title="Deploy Info"
					description="View deployment and environment details"
				>
					<DeployInfoContainer />
				</SettingsSection>
				<SettingsSection
					title="Performance"
					description="Monitor system performance metrics"
				>
					<PerformanceListContainer />
				</SettingsSection>
			</div>
		</SettingsPane>
	);
}
