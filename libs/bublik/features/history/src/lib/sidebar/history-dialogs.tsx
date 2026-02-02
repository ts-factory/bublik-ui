/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { InstructionDialog } from '@/shared/tailwind-ui';

import historySidebar from './images/history-sidebar.webp';
import historyEditSearch from './images/history-search.webp';
import historyRunHover from './images/history-run-hover.webp';
import historyTrendchartsOne from './images/trend-charts-1.webp';
import historyTrendchartsTwo from './images/trend-charts-2.webp';
import historyTrendchartsThree from './images/trend-charts-3.webp';
import historySeriesOne from './images/series-1.webp';
import historySeriesTwo from './images/series-2.webp';
import historySeriesThree from './images/series-3.webp';
// Stacked charts uses the same trend images for now
import stackedChartsOne from './images/trend-charts-1.webp';
import stackedChartsTwo from './images/trend-charts-2.webp';
import stackedChartsThree from './images/trend-charts-3.webp';

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

export function HistoryHelpTrendChartsDialog() {
	return (
		<InstructionDialog
			dialogTitle="History - Trend Charts"
			dialogDescription=""
			steps={[
				{
					title: 'Access history page via sidebar link',
					description: 'Open the sidebar to navigate to history page',
					image: historyTrendchartsOne
				},
				{
					title: 'Specify search query to view history',
					description:
						'Specify search query to filter result by parameters, verdicts, etc.',
					image: historyTrendchartsTwo
				},
				{
					title: 'View Trend Charts',
					description:
						'Click on "Trend Charts" label in sidebar to view results ordered by their start time',
					image: historyTrendchartsThree
				}
			]}
		/>
	);
}

export function HistoryHelpMeasurementSeriesDialog() {
	return (
		<InstructionDialog
			dialogTitle="History - Series Charts"
			dialogDescription=""
			steps={[
				{
					title: 'Access history page via sidebar link',
					description: 'Open the sidebar to navigate to history page',
					image: historySeriesOne
				},
				{
					title: 'Specify search query to view history',
					description:
						'Specify search query to filter result by parameters, verdicts, etc.',
					image: historyTrendchartsTwo
				},
				{
					title: 'View Series Charts',
					description:
						'Click on "Series Charts" to view the measurement series charts for all iterations that match the search query',
					image: historySeriesTwo
				},
				{
					title: 'Empty Series Charts',
					description:
						'In case no series charts present you will see this page',
					image: historySeriesThree
				}
			]}
		/>
	);
}

export function HistoryHelpStackedChartsDialog() {
	return (
		<InstructionDialog
			dialogTitle="History - Stacked Charts"
			dialogDescription=""
			steps={[
				{
					title: 'Access history page via sidebar link',
					description: 'Open the sidebar to navigate to history page',
					image: stackedChartsOne
				},
				{
					title: 'Specify search query to view history',
					description:
						'Specify search query to filter result by parameters, verdicts, etc.',
					image: stackedChartsTwo
				},
				{
					title: 'Select charts for stacking',
					description:
						'Go to Trend Charts or Series Charts and click the "+" button on charts you want to combine',
					image: stackedChartsThree
				},
				{
					title: 'View Stacked Charts',
					description:
						'Once you have selected charts, click on "Stacked Charts" to view them combined',
					image: historySidebar
				}
			]}
		/>
	);
}
