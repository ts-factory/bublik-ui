/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { LogPageMode, MeasurementsMode } from '@/shared/types';
import { Icon } from '@/shared/tailwind-ui';

import { NavLink, SidebarItem } from '../nav-link';

const mainMenu: SidebarItem[] = [
	{
		label: 'Dashboard',
		to: '/dashboard',
		icon: <Icon name="Category" />,
		pattern: { path: '/dashboard' }
	},
	{
		label: 'Runs',
		to: '/runs',
		icon: <Icon name="Play" />,
		pattern: [{ path: '/runs' }, { path: '/compare' }],
		subitems: [
			{
				label: 'List',
				to: '/runs',
				icon: <Icon name="PaperListText" size={24} />,
				pattern: { path: '/runs', search: { mode: 'table' } }
			},
			{
				label: 'Charts',
				to: '/runs',
				icon: <Icon name="LineChartMultiple" />,
				pattern: { path: '/runs', search: { mode: 'charts' } }
			},
			{
				label: 'Compare',
				to: '/compare',
				icon: <Icon name="SwapArrows" className="rotate-90" />,
				pattern: { path: '/compare' }
			}
		]
	},
	{
		label: 'Run',
		to: '/runs',
		icon: <Icon name="PieChart" />,
		pattern: { path: '/runs/:runId/*' },
		subitems: [
			{
				label: 'Details',
				icon: <Icon name="Paper" className="w-6 h-6" />,
				to: '/runs',
				pattern: { path: '/runs/:runId' }
			},
			{
				label: 'Report',
				icon: <Icon name="LineChart" />,
				to: '/runs',
				pattern: { path: '/runs/:runId/report' }
			}
		]
	},
	{
		label: 'Log',
		icon: <Icon name="Paper" size={28} />,
		to: '/log',
		pattern: { path: '/log/:runId' },
		subitems: [
			{
				label: 'Tree+info+log',
				icon: <Icon name="LayoutLogHeaderSidebar" />,
				to: '/log',
				pattern: {
					path: '/log/:runId',
					search: { mode: LogPageMode.TreeAndInfoAndLog }
				}
			},
			{
				label: 'Tree+log',
				icon: <Icon name="LayoutLogSidebar" />,
				to: '/log',
				pattern: {
					path: '/log/:runId',
					search: { mode: LogPageMode.TreeAndLog }
				}
			},
			{
				label: 'Info+log',
				icon: <Icon name="LayoutLogHeader" />,
				to: '/log',
				pattern: {
					path: '/log/:runId',
					search: { mode: LogPageMode.InfoAndLog }
				}
			},
			{
				label: 'Log',
				icon: <Icon name="LayoutLogSingle" />,
				to: '/log',
				pattern: { path: '/log/:runId', search: { mode: LogPageMode.Log } }
			}
		]
	},
	{
		label: 'History',
		to: '/history',
		icon: <Icon name="TimeCircle" />,
		pattern: { path: '/history' },
		subitems: [
			{
				label: 'List of results',
				to: '/history',
				icon: <Icon name="PaperListText" />,
				pattern: { path: '/history', search: { mode: 'linear', page: '1' } }
			},
			{
				label: 'Group iterations by verdicts',
				to: '/history',
				icon: <Icon name="Aggregation" />,
				pattern: {
					path: '/history',
					search: { mode: 'aggregation', page: '1' }
				}
			},
			{
				label: 'Charts',
				to: '/history',
				icon: <Icon name="LineChartSingle" />,
				pattern: { path: '/history', search: { mode: 'measurements' } }
			},
			{
				label: 'Charts Combined',
				to: '/history',
				icon: <Icon name="LineChartMultiple" />,
				pattern: { path: '/history', search: { mode: 'measurements-combined' } }
			}
		]
	},
	{
		label: 'Measurements',
		to: '/runs',
		icon: <Icon name="LineGraph" />,
		pattern: {
			path: '/runs/:runId/results/:resultId/measurements',
			search: { mode: MeasurementsMode.Default }
		},
		subitems: [
			{
				label: 'Charts + Tables',
				icon: <Icon name="LineChart" />,
				to: '/runs',
				pattern: {
					path: '/runs/:runId/results/:resultId/measurements',
					search: { mode: MeasurementsMode.Default }
				}
			},
			{
				label: 'Split',
				icon: <Icon name="LayoutSidebarHeader" />,
				to: '/runs',
				pattern: {
					path: '/runs/:runId/results/:resultId/measurements',
					search: { mode: MeasurementsMode.Split }
				}
			},
			{
				label: 'Tables',
				icon: <Icon name="PaperListText" />,
				to: '/runs',
				pattern: {
					path: '/runs/:runId/results/:resultId/measurements',
					search: { mode: MeasurementsMode.Tables }
				}
			},
			{
				label: 'Stacked',
				icon: <Icon name="LineChartMultiple" />,
				to: '/runs',
				pattern: {
					path: '/runs/:runId/results/:resultId/measurements',
					search: { mode: MeasurementsMode.Overlay }
				}
			}
		]
	}
];

export const MainNavigation = () => {
	return (
		<ul className="flex flex-col gap-3">
			{mainMenu.map((item) => (
				<li key={item.label}>
					<NavLink {...item} />
				</li>
			))}
		</ul>
	);
};
