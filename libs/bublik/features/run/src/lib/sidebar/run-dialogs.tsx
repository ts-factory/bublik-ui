/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { InstructionDialog } from '@/shared/tailwind-ui';

import multipleRuns1 from './images/run-link-session-list.webp';
import runSidebar from './images/go-to-run-details.webp';

export function RunDetailsDialog() {
	return (
		<InstructionDialog
			dialogTitle="Run Details"
			dialogDescription="Follow these steps to view run details."
			steps={[
				{
					title: 'Go to the Runs page',
					description: 'Visit the Runs page to view your existing runs.',
					image: multipleRuns1
				},
				{
					title: 'Select the run you want to view',
					description: 'Select the run you want to view by clicking on it.',
					image: runSidebar
				}
			]}
		/>
	);
}

export function RunReportDialog() {
	return (
		<InstructionDialog
			dialogTitle="Report"
			dialogDescription="Follow these steps to view run report. It is available only for a run whose project has a report config."
			steps={[
				{
					title: 'Go to the Run Details page',
					description: 'Visit the Run Details page to view the run details.',
					image: runSidebar
				},
				{
					title: 'Open a report from the sidebar',
					description:
						'Click on Report in the sidebar to open a report, or use the arrow next to it to pick another one.',
					image: runSidebar
				}
			]}
		/>
	);
}

export function RunIssuesDialog() {
	return (
		<InstructionDialog
			dialogTitle="Issues"
			dialogDescription="Issues lists every classified failure in a run. It is available only once at least one result in the run carries a classification stamp."
			steps={[
				{
					title: 'Go to the Run Details page',
					description: 'Visit the Run Details page to view the run details.',
					image: runSidebar
				},
				{
					title: 'Classify a failing result',
					description:
						'Use the Classify action on a failing result, or press "Apply rules" on the Issues page to stamp this run with the already active rules. Creating a rule does not classify existing runs on its own.',
					image: runSidebar
				}
			]}
		/>
	);
}

export function RunMainDialog() {
	return (
		<InstructionDialog
			dialogTitle="Run Navigation"
			dialogDescription="Follow these steps to navigate to a run."
			steps={[
				{
					title: 'Go to the Runs page',
					description: 'Visit the Runs page to view your existing runs.',
					image: multipleRuns1
				},
				{
					title: 'Select the run you want to view',
					description: 'Select the run you want to view by clicking on it.',
					image: runSidebar
				}
			]}
		/>
	);
}
