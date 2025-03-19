/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode } from 'react';
import { VisibilityState } from '@tanstack/react-table';

import {
	ResultTableFilter,
	RESULT_PROPERTIES,
	RESULT_TYPE
} from '@/shared/types';
import { Icon } from '@/shared/tailwind-ui';

import { ColumnId } from '../types';

export const UnexpectedColumns: string[] = [
	ColumnId.PassedUnexpected,
	ColumnId.FailedUnexpected,
	ColumnId.SkippedUnexpected,
	ColumnId.Abnormal
];

const createUnexpectedColumnGetter =
	(unexpectedColumns: string[]) => (columnId: string) =>
		unexpectedColumns.includes(columnId);

export const getUnexpectedResultForColumnId = (
	columnId: string
): ResultTableFilter => {
	switch (columnId) {
		case ColumnId.PassedUnexpected:
			return {
				results: [RESULT_TYPE.Passed],
				resultProperties: [RESULT_PROPERTIES.Unexpected]
			};
		case ColumnId.FailedUnexpected:
			return {
				results: [RESULT_TYPE.Failed, RESULT_TYPE.Killed, RESULT_TYPE.Cored],
				resultProperties: [RESULT_PROPERTIES.Unexpected]
			};
		case ColumnId.SkippedUnexpected:
			return {
				results: [RESULT_TYPE.Skipped],
				resultProperties: [RESULT_PROPERTIES.Unexpected]
			};
		default:
			return {
				results: [],
				resultProperties: []
			};
	}
};

export const isUnexpectedColumn =
	createUnexpectedColumnGetter(UnexpectedColumns);

export const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
	[ColumnId.Total]: false,
	[ColumnId.Objective]: false,
	[ColumnId.Comments]: false
};

type ColumnGroup = {
	id: string;
	label: ReactNode;
	columns: ColumnId[];
	className?: string;
};

export const COLUMN_GROUPS: ColumnGroup[] = [
	{ id: 'Tree', label: '', columns: [ColumnId.Tree] },
	{ id: 'Comments', label: '', columns: [ColumnId.Comments] },
	{ id: 'Objective', label: '', columns: [ColumnId.Objective] },
	{
		id: 'Total and Run',
		label: '',
		columns: [ColumnId.Total, ColumnId.Run]
	},
	{
		id: 'Expected Results (Passed/Failed)',
		label: (
			<div className="flex items-center justify-center gap-2">
				<span>EXPECTED</span>
				<Icon
					name="InformationCircleCheckmark"
					size={16}
					className="text-text-expected"
				/>
			</div>
		),
		columns: [ColumnId.PassedExpected, ColumnId.FailedExpected],
		className: 'bg-badge-3'
	},
	{
		id: 'Unexpected Results (Passed/Failed)',
		label: (
			<div className="flex items-center justify-center gap-2">
				<span>UNEXPECTED</span>
				<Icon
					name="InformationCircleExclamationMark"
					size={16}
					className="text-text-unexpected"
				/>
			</div>
		),
		columns: [ColumnId.PassedUnexpected, ColumnId.FailedUnexpected],
		className: 'bg-bg-fillError'
	},
	{
		id: 'Skipped Results (Expected/Unexpected)',
		label: (
			<div className="flex items-center justify-center gap-2">
				<span>SKIPPED</span>
			</div>
		),
		columns: [ColumnId.SkippedExpected, ColumnId.SkippedUnexpected],
		className: 'bg-gray-50'
	},
	{ id: 'Abnormal', label: '', columns: [ColumnId.Abnormal] }
];
