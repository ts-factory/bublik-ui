/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { LogPageMode, MeasurementsMode } from '@/shared/types';
import { Icon } from '@/shared/tailwind-ui';

import { NavLink, SidebarItem } from '../nav-link';
import {
	MultipleRunsDialog,
	CompareRunsDialog,
	RunDetailsDialog,
	RunReportDialog,
	LogDialog,
	ResultMeasurementsDialog,
	HistoryHelpDialog,
	RunsDialog,
	RunsChartsDialog,
	DashboardDialog,
	HistoryHelpTrendChartsDialog,
	HistoryHelpMeasurementSeriesDialog
} from './instruction-dialog';

const mainMenu: SidebarItem[] = [
	{
		label: 'Dashboard',
		to: '/dashboard',
		icon: <Icon name="Category" />,
		pattern: { path: '/dashboard' },
		dialogContent: <DashboardDialog />
	},
	{
		label: 'Runs',
		to: '/runs',
		icon: <Icon name="Play" />,
		dialogContent: <RunsDialog />,
		pattern: [{ path: '/runs' }, { path: '/compare' }, { path: '/multiple' }],
		subitems: [
			{
				label: 'List',
				to: '/runs',
				dialogContent: <RunsDialog />,
				icon: <Icon name="PaperListText" size={24} />,
				pattern: { path: '/runs', search: { mode: 'table' } }
			},
			{
				label: 'Charts',
				to: '/runs',
				dialogContent: <RunsChartsDialog />,
				icon: <Icon name="LineChartMultiple" />,
				pattern: { path: '/runs', search: { mode: 'charts' } }
			},
			{
				label: 'Multiple',
				icon: <Icon name="PaperStack" className="w-6 h-6" />,
				to: '/runs',
				whenMatched: true,
				pattern: { path: '/multiple' },
				dialogContent: <MultipleRunsDialog />
			},
			{
				label: 'Compare',
				to: '/compare',
				whenMatched: true,
				dialogContent: <CompareRunsDialog />,
				icon: <Icon name="SwapArrows" className="rotate-90" />,
				pattern: { path: '/compare' }
			}
		]
	},
	{
		label: 'Run',
		to: '/runs',
		icon: <Icon name="PieChart" />,
		pattern: [{ path: '/runs/:runId' }],
		whenMatched: true,
		dialogContent: <RunDetailsDialog />,
		subitems: [
			{
				label: 'Details',
				icon: <Icon name="Paper" className="w-6 h-6" />,
				to: '/runs',
				whenMatched: true,
				dialogContent: <RunDetailsDialog />,
				pattern: { path: '/runs/:runId' }
			},
			{
				label: 'Report',
				icon: <Icon name="LineChart" />,
				to: '/runs',
				whenMatched: true,
				pattern: { path: '/runs/:runId/report' },
				dialogContent: <RunReportDialog />
			}
		]
	},
	{
		label: 'Log',
		icon: <Icon name="Paper" size={28} />,
		to: '/log',
		pattern: { path: '/log/:runId' },
		whenMatched: true,
		dialogContent: <LogDialog />,
		subitems: [
			{
				label: 'Tree+info+log',
				icon: <Icon name="LayoutLogHeaderSidebar" />,
				to: '/log',
				whenMatched: true,
				dialogContent: <LogDialog />,
				pattern: {
					path: '/log/:runId',
					search: { mode: LogPageMode.TreeAndInfoAndLog }
				}
			},
			{
				label: 'Tree+log',
				icon: <Icon name="LayoutLogSidebar" />,
				to: '/log',
				whenMatched: true,
				dialogContent: <LogDialog />,
				pattern: {
					path: '/log/:runId',
					search: { mode: LogPageMode.TreeAndLog }
				}
			},
			{
				label: 'Info+log',
				icon: <Icon name="LayoutLogHeader" />,
				to: '/log',
				whenMatched: true,
				dialogContent: <LogDialog />,
				pattern: {
					path: '/log/:runId',
					search: { mode: LogPageMode.InfoAndLog }
				}
			},
			{
				label: 'Log',
				icon: <Icon name="LayoutLogSingle" />,
				to: '/log',
				whenMatched: true,
				dialogContent: <LogDialog />,
				pattern: { path: '/log/:runId', search: { mode: LogPageMode.Log } }
			}
		]
	},
	{
		label: 'History',
		to: '/history',
		icon: <Icon name="TimeCircle" />,
		dialogContent: <HistoryHelpDialog />,
		pattern: { path: '/history' },
		subitems: [
			{
				label: 'List Of Results',
				to: '/history',
				dialogContent: <HistoryHelpDialog />,
				icon: <Icon name="PaperListText" />,
				pattern: { path: '/history', search: { mode: 'linear', page: '1' } }
			},
			{
				label: 'Groups Of Results',
				to: '/history',
				dialogContent: <HistoryHelpDialog />,
				icon: <Icon name="Aggregation" />,
				pattern: {
					path: '/history',
					search: { mode: 'aggregation', page: '1' }
				}
			},
			{
				label: 'Trend Charts',
				to: '/history',
				dialogContent: <HistoryHelpTrendChartsDialog />,
				icon: <Icon name="LineChartSingle" />,
				pattern: { path: '/history', search: { mode: 'measurements' } }
			},
			{
				label: 'Series Charts',
				to: '/history',
				dialogContent: <HistoryHelpMeasurementSeriesDialog />,
				icon: <Icon name="LineChartSingle" />,
				pattern: {
					path: '/history',
					search: { mode: 'measurements-by-iteration' }
				}
			},
			{
				label: 'Stacked Charts',
				to: '/history',
				dialogContent: <HistoryHelpDialog />,
				icon: <Icon name="LineChartMultiple" />,
				pattern: { path: '/history', search: { mode: 'measurements-combined' } }
			}
		]
	},
	{
		label: 'Result',
		to: '/runs/:runId/results/:resultId/measurements',
		icon: <Icon name="LineGraph" />,
		whenMatched: true,
		dialogContent: <ResultMeasurementsDialog />,
		pattern: {
			path: '/runs/:runId/results/:resultId/measurements',
			search: { mode: MeasurementsMode.Default }
		},
		subitems: [
			{
				label: 'Charts + Tables',
				icon: <Icon name="LineChart" />,
				to: '/runs',
				whenMatched: true,
				dialogContent: <ResultMeasurementsDialog />,
				pattern: {
					path: '/runs/:runId/results/:resultId/measurements',
					search: { mode: MeasurementsMode.Default }
				}
			},
			{
				label: 'Charts || Tables',
				icon: <Icon name="LayoutSidebarHeader" />,
				to: '/runs',
				whenMatched: true,
				dialogContent: <ResultMeasurementsDialog />,
				pattern: {
					path: '/runs/:runId/results/:resultId/measurements',
					search: { mode: MeasurementsMode.Split }
				}
			},
			{
				label: 'Measurement Tables',
				icon: <Icon name="PaperListText" />,
				to: '/runs',
				whenMatched: true,
				dialogContent: <ResultMeasurementsDialog />,
				pattern: {
					path: '/runs/:runId/results/:resultId/measurements',
					search: { mode: MeasurementsMode.Tables }
				}
			},
			{
				label: 'Stacked Charts',
				icon: <Icon name="LineChartMultiple" />,
				to: '/runs',
				whenMatched: true,
				dialogContent: <ResultMeasurementsDialog />,
				pattern: {
					path: '/runs/:runId/results/:resultId/measurements',
					search: { mode: MeasurementsMode.Overlay }
				}
			}
		]
	}
];

function MainNavigation() {
	return (
		<ul className="flex flex-col gap-3">
			{mainMenu.map((item) => (
				<NavLink key={item.label} {...item} />
			))}
		</ul>
	);
}

export { MainNavigation };
