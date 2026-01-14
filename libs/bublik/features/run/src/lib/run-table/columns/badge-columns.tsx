/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { RunTableColumnConfig, ColumnId } from '../types';

import { RESULT_PROPERTIES, RESULT_TYPE } from '@/shared/types';
import { BadgeVariants, Icon } from '@/shared/tailwind-ui';
import {
	getAbnormal,
	getFailedExpected,
	getFailedUnexpected,
	getPassedExpected,
	getPassedUnexpected,
	getSkippedExpected,
	getSkippedUnexpected,
	getTotalRunStats,
	getRunRunStats,
	getExpectedTotal,
	getUnexpectedTotal
} from '@/bublik/run-utils';

import { createRunColumn } from './utils';

const columnConfigs: RunTableColumnConfig[] = [
	{
		id: ColumnId.Total,
		accessor: getTotalRunStats,
		header: 'Total',
		variant: BadgeVariants.PrimaryActive,
		resultProperties: [
			RESULT_PROPERTIES.Expected,
			RESULT_PROPERTIES.Unexpected
		],
		results: [
			RESULT_TYPE.Passed,
			RESULT_TYPE.Failed,
			RESULT_TYPE.Killed,
			RESULT_TYPE.Cored,
			RESULT_TYPE.Incomplete,
			RESULT_TYPE.Skipped,
			RESULT_TYPE.Faked
		]
	},
	{
		id: ColumnId.Run,
		accessor: getRunRunStats,
		header: 'Run',
		variant: BadgeVariants.PrimaryActive,
		resultProperties: [
			RESULT_PROPERTIES.Expected,
			RESULT_PROPERTIES.Unexpected
		],
		results: [
			RESULT_TYPE.Passed,
			RESULT_TYPE.Failed,
			RESULT_TYPE.Killed,
			RESULT_TYPE.Cored,
			RESULT_TYPE.Incomplete
		]
	},
	{
		id: ColumnId.ExpectedTotal,
		accessor: getExpectedTotal,
		header: 'Total',
		variant: BadgeVariants.ExpectedActive,
		resultProperties: [RESULT_PROPERTIES.Expected],
		results: [RESULT_TYPE.Passed, RESULT_TYPE.Failed, RESULT_TYPE.Skipped],
		icon: (
			<Icon
				name="InformationCircleCheckmark"
				size={16}
				className="text-text-expected"
			/>
		)
	},
	{
		id: ColumnId.UnexpectedTotal,
		accessor: getUnexpectedTotal,
		header: 'Total',
		variant: BadgeVariants.UnexpectedActive,
		resultProperties: [RESULT_PROPERTIES.Unexpected],
		results: [
			RESULT_TYPE.Passed,
			RESULT_TYPE.Failed,
			RESULT_TYPE.Killed,
			RESULT_TYPE.Cored,
			RESULT_TYPE.Skipped,
			RESULT_TYPE.Incomplete,
			RESULT_TYPE.Faked
		],
		icon: (
			<Icon
				name="InformationCircleExclamationMark"
				size={16}
				className="text-text-unexpected"
			/>
		)
	},
	{
		id: ColumnId.PassedExpected,
		accessor: getPassedExpected,
		header: 'PASSED',
		variant: BadgeVariants.ExpectedActive,
		resultProperties: [RESULT_PROPERTIES.Expected],
		results: [RESULT_TYPE.Passed],
		icon: (
			<Icon
				name="InformationCircleCheckmark"
				size={16}
				className="text-text-expected"
			/>
		)
	},
	{
		id: ColumnId.FailedExpected,
		accessor: getFailedExpected,
		header: 'FAILED',
		variant: BadgeVariants.ExpectedActive,
		resultProperties: [RESULT_PROPERTIES.Expected],
		results: [RESULT_TYPE.Failed, RESULT_TYPE.Killed, RESULT_TYPE.Cored],
		icon: (
			<Icon
				name="InformationCircleCheckmark"
				size={16}
				className="text-text-expected"
			/>
		)
	},
	{
		id: ColumnId.PassedUnexpected,
		accessor: getPassedUnexpected,
		header: 'PASSED',
		variant: BadgeVariants.UnexpectedActive,
		resultProperties: [RESULT_PROPERTIES.Unexpected],
		results: [RESULT_TYPE.Passed],
		icon: (
			<Icon
				name="InformationCircleExclamationMark"
				size={16}
				className="text-text-unexpected"
			/>
		)
	},
	{
		id: ColumnId.FailedUnexpected,
		accessor: getFailedUnexpected,
		header: 'FAILED',
		variant: BadgeVariants.UnexpectedActive,
		resultProperties: [RESULT_PROPERTIES.Unexpected],
		results: [RESULT_TYPE.Failed, RESULT_TYPE.Killed, RESULT_TYPE.Cored],
		icon: (
			<Icon
				name="InformationCircleExclamationMark"
				size={16}
				className="text-text-unexpected"
			/>
		)
	},
	{
		id: ColumnId.SkippedExpected,
		accessor: getSkippedExpected,
		header: 'SKIPPED',
		variant: BadgeVariants.ExpectedActive,
		results: [RESULT_TYPE.Skipped],
		resultProperties: [RESULT_PROPERTIES.Expected],
		icon: (
			<Icon
				name="InformationCircleCheckmark"
				size={16}
				className="text-text-expected"
			/>
		)
	},
	{
		id: ColumnId.SkippedUnexpected,
		accessor: getSkippedUnexpected,
		header: 'SKIPPED',
		variant: BadgeVariants.UnexpectedActive,
		results: [RESULT_TYPE.Skipped],
		resultProperties: [RESULT_PROPERTIES.Unexpected],
		icon: (
			<Icon
				name="InformationCircleExclamationMark"
				size={16}
				className="text-text-unexpected"
			/>
		)
	},
	{
		id: ColumnId.Abnormal,
		header: 'Abnormal',
		accessor: getAbnormal,
		variant: BadgeVariants.Unexpected,
		results: [
			RESULT_TYPE.Killed,
			RESULT_TYPE.Cored,
			RESULT_TYPE.Incomplete,
			RESULT_TYPE.Faked
		],
		icon: (
			<Icon
				name="InformationCircleQuestionMark"
				size={16}
				className="text-text-unexpected"
			/>
		)
	}
];

export const badgeColumns = columnConfigs.map(createRunColumn);
