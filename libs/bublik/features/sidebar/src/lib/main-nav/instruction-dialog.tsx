/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2025 OKTET LTD */
import { InstructionDialog } from '@/shared/tailwind-ui';

import multipleRuns1 from './images/runs/multiple-1.png';
import multipleRuns2 from './images/runs/multiple-2.png';
import multipleRuns3 from './images/runs/multiple-3.png';
import compareRuns1 from './images/runs/compare.png';
import compareRunsSelect from './images/runs/compare-runs-select.png';

import runLinkFromSessionList from './images/runs/run-link-session-list.png';
import runSidebar from './images/runs/go-to-run-details.png';

import runReport from './images/runs/report-link.png';

import logLinkFromRuns from './images/log/log-link.png';
import logLinkFromRunDetails from './images/log/log-from-run.png';
import logLinkFromHistory from './images/log/log-from-history.png';

import resultLinkFromLog from './images/result/result-from-log.png';
import resultLinkFromRunDetails from './images/result/result-from-run.png';
import resultLinkFromHistory from './images/result/result-from-history.png';

import historySidebar from './images/history/history-sidebar.png';
import historyEditSearch from './images/history/history-search.png';
import historyRunHover from './images/history/history-run-hover.png';

import runsSidebar from './images/runs/runs-sidebar.png';

import runsConclusionReason from './images/runs/run-reason.png';

import runsCharts from './images/runs/runs-charts-click.png';

import runsChartsDialog from './images/runs/runs-charts-dialog.png';

import dashboardSidebar from './images/dashboard/dashboard-sidebar.png';

import dashboardLinks from './images/dashboard/dashboard-links.png';

import dashboardControls from './images/dashboard/dashboard-hints.png';

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
					image: runLinkFromSessionList
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

export function LogDialog() {
	return (
		<InstructionDialog
			dialogTitle="Log"
			dialogDescription="Follow these steps to view log."
			steps={[
				{
					title: 'You can visit log from the Runs Page',
					description: 'Visit the Runs page to view the runs.',
					image: logLinkFromRuns
				},
				{
					title: 'You can visit log from the Run Details Page',
					description: 'Visit the Run Details page to view the run details.',
					image: logLinkFromRunDetails
				},
				{
					title: 'You can visit log from the History Page',
					description: 'Visit the History page to view the history.',
					image: logLinkFromHistory
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

export function DashboardDialog() {
	return (
		<InstructionDialog
			dialogTitle="Dashboard"
			dialogDescription="Follow these steps to view dashboard."
			steps={[
				{
					title: 'You can visit dashboard from the sidebar',
					description: 'Visit the sidebar to view the dashboard.',
					image: dashboardSidebar
				},
				{
					title: 'You can view dashboard links',
					description: 'You can view the dashboard links.',
					image: dashboardLinks
				},
				{
					title: 'Dashboard Controls',
					description: 'You can view the dashboard controls.',
					image: dashboardControls
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

export function ResultMeasurementsDialog() {
	return (
		<InstructionDialog
			dialogTitle="Result"
			dialogDescription="Follow these steps to view result measurements."
			steps={[
				{
					title: 'You can visit result from the Log Page',
					description: 'Visit the Log page to view the log.',
					image: resultLinkFromLog
				},
				{
					title: 'You can visit result from the Run Details Page',
					description: 'Visit the Run Details page to view the run details.',
					image: resultLinkFromRunDetails
				},
				{
					title: 'You can visit result from the History Page',
					description: 'Visit the History page to view the history.',
					image: resultLinkFromHistory
				}
			]}
		/>
	);
}

export function HistoryHelpDialog() {
	return (
		<InstructionDialog
			dialogTitle="History"
			dialogDescription="Follow these steps to view history."
			steps={[
				{
					title: 'You can visit history from the sidebar',
					description: 'Visit the sidebar to view the history.',
					image: historySidebar
				},
				{
					title: 'You can edit search parameters',
					description: 'You can edit search parameters to filter the history.',
					image: historyEditSearch
				},
				{
					title: 'History shortcuts',
					description: 'You can hover over link to history to see shortcuts.',
					image: historyRunHover
				}
			]}
		/>
	);
}
