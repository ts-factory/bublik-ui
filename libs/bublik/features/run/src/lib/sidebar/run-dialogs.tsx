/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { InstructionDialog } from '@/shared/tailwind-ui';

import multipleRuns1 from './images/run-link-session-list.webp';
import runSidebar from './images/go-to-run-details.webp';
import runReport from './images/report-link.webp';

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
			dialogDescription="Follow these steps to view run report."
			steps={[
				{
					title: 'Go to the Run Details page',
					description: 'Visit the Run Details page to view the run details.',
					image: runSidebar
				},
				{
					title: 'Click on the "Report" button',
					description: 'Click on the "Report" button to view the run report.',
					image: runReport
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
