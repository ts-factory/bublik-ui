/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Meta } from '@storybook/react';

import { withBackground } from '@/shared/tailwind-ui';

import { HistoryFilterLegend } from './history-filter-legend.component';

const Story: Meta<typeof HistoryFilterLegend> = {
	component: HistoryFilterLegend,
	title: 'history/Filter Legend',
	decorators: [withBackground]
};
export default Story;

export const Primary = {
	args: {
		items: [
			{
				iconName: 'Paper',
				iconSize: 24,
				label: 'Test name',
				value: 'app_rtt'
			},
			{
				iconName: 'Calendar',
				label: 'Date',
				value: '2022-07-15 — 2022-10-15'
			},
			{
				iconName: 'HashSymbol',
				label: 'Hash',
				value: null
			},
			{
				iconName: 'BoxCheckmark',
				iconSize: 24,
				label: 'Obtained result',
				value: [
					'PASSED',
					'FAILED',
					'KILLED',
					'CORED',
					'SKIPPED',
					'FAKED',
					'INCOMPLETE'
				]
			},
			{
				iconName: 'PaperShort',
				iconSize: 24,
				label: 'Branches',
				value: null
			},
			{
				iconName: 'PaperShort',
				iconSize: 24,
				label: 'Revisions',
				value: null
			},
			{
				iconName: 'PaperShort',
				iconSize: 24,
				label: 'Tags expressions'
			},
			{
				iconName: 'PaperShort',
				iconSize: 24,
				label: 'Run',
				value: ['notcompromised']
			},
			{
				iconName: 'PaperShort',
				iconSize: 24,
				label: 'Result type classification',
				value: ['unexpected']
			},
			{
				iconName: 'PaperShort',
				iconSize: 24,
				label: 'Verdict mode',
				value: 'string'
			},
			{
				iconName: 'PaperShort',
				iconSize: 24,
				label: 'Verdict value',
				value: null
			}
		]
	}
};
