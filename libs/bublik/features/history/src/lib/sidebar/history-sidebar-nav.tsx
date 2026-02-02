/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { Icon } from '@/shared/tailwind-ui';
import { NavLink } from '@/bublik/features/sidebar-nav';
import {
	HistoryHelpDialog,
	HistoryHelpTrendChartsDialog,
	HistoryHelpMeasurementSeriesDialog
} from './history-dialogs';

export function HistorySidebarNav() {
	return (
		<NavLink
			label="History"
			to="/history"
			icon={<Icon name="TimeCircle" />}
			dialogContent={<HistoryHelpDialog />}
			pattern={{ path: '/history' }}
			subitems={[
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
					pattern: {
						path: '/history',
						search: { mode: 'measurements-combined' }
					}
				}
			]}
		/>
	);
}
