/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { VisibilityState } from '@tanstack/react-table';

import {
	ResultTableFilter,
	RESULT_PROPERTIES,
	RESULT_TYPE
} from '@/shared/types';

import { ColumnId } from '../types';

export const UnexpectedColumns: string[] = [
	ColumnId.PassedUnexpected,
	ColumnId.FailedUnexpected,
	ColumnId.SkippedUnexpected
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

export const COLUMN_GROUPS: ColumnId[][] = [
	[ColumnId.Tree],
	[ColumnId.Total, ColumnId.Run],
	[ColumnId.PassedExpected, ColumnId.FailedExpected],
	[ColumnId.PassedUnexpected, ColumnId.FailedUnexpected],
	[ColumnId.SkippedExpected, ColumnId.SkippedUnexpected],
	[ColumnId.Abnormal]
];
