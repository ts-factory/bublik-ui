/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { InstructionDialog } from '@/shared/tailwind-ui';

import multipleRuns1 from './images/multiple-1.webp';
import multipleRuns2 from './images/multiple-2.webp';
import multipleRuns3 from './images/multiple-3.webp';
import compareRuns1 from './images/compare.webp';
import compareRunsSelect from './images/compare-runs-select.webp';
import runsSidebar from './images/runs-sidebar.webp';
import runsConclusionReason from './images/run-reason.webp';
import runsCharts from './images/runs-charts-click.webp';
import runsChartsDialog from './images/runs-charts-dialog.webp';
import runLinkFromSessionList from './images/run-link-session-list.webp';

export function MultipleRunsDialog() {
	return (
		<InstructionDialog
			dialogTitle="Multiple Runs"
			dialogDescription="Follow these steps to combine multiple runs."
			steps={[
				{
					title: 'Go to the Runs page',
					description: 'Visit the Runs page to view your existing runs.',
					image: multipleRuns1
				},
				{
					title: 'Select the runs you want to combine',
					description:
						'Select the runs you want to combine by clicking on them.',
					image: multipleRuns2
				},
				{
					title: 'Click on the "Multiple" button',
					description:
						'Click on the "Multiple" button to combine the selected runs.',
					image: multipleRuns3
				}
			]}
		/>
	);
}

export function CompareRunsDialog() {
	return (
		<InstructionDialog
			dialogTitle="Compare Runs"
			dialogDescription="Follow these steps to compare runs."
			steps={[
				{
					title: 'Go to the Compare page',
					description: 'Visit the Compare page to view your existing runs.',
					image: multipleRuns1
				},
				{
					title: 'Select the runs you want to compare',
					description:
						'Select the runs you want to compare by clicking on them.',
					image: compareRunsSelect
				},
				{
					title: 'Click on the "Compare" button',
					description:
						'Click on the "Compare" button to compare the selected runs.',
					image: compareRuns1
				}
			]}
		/>
	);
}

export function RunsDialog() {
	return (
		<InstructionDialog
			dialogTitle="Runs"
			dialogDescription="Follow these steps to view runs."
			steps={[
				{
					title: 'You can visit runs from the sidebar',
					description: 'Visit the sidebar to view the runs.',
					image: runsSidebar
				},
				{
					title: 'Conclusion Reason',
					description: 'You can view the conclusion reason of the run.',
					image: runsConclusionReason
				}
			]}
		/>
	);
}

export function RunsChartsDialog() {
	return (
		<InstructionDialog
			dialogTitle="Runs"
			dialogDescription="Follow these steps to view runs."
			steps={[
				{
					title: 'You can visit runs from the sidebar',
					description: 'Visit the sidebar to view the runs.',
					image: runsSidebar
				},
				{
					title: 'You can view runs charts',
					description: 'Click on the "Charts" button to view the runs charts.',
					image: runsCharts
				},
				{
					title: 'Run Charts Dialog',
					description: 'You can view the runs in the dialog.',
					image: runsChartsDialog
				}
			]}
		/>
	);
}
