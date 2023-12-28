/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { RESULT_PROPERTIES, RESULT_TYPE, RunData } from '@/shared/types';
import { BadgeVariants } from '@/shared/tailwind-ui';

import { ReactNode } from 'react';

/** !!! DO NOT CHANGE !!!
 * This will break URL links
 */
export const enum ColumnId {
	Tree = 'TREE',
	Total = 'TOTAL',
	Run = 'RUN',
	PassedExpected = 'PASSED_EXPECTED',
	FailedExpected = 'FAILED_EXPECTED',
	PassedUnexpected = 'PASSED_UNEXPECTED',
	FailedUnexpected = 'FAILED_UNEXPECTED',
	SkippedExpected = 'SKIPPED_EXPECTED',
	SkippedUnexpected = 'SKIPPED_UNEXPECTED',
	Abnormal = 'ABNORMAL'
}

export type GlobalFilterValue = {
	/** Row ID */
	rowId: string;
	/** Column ID */
	columnId: ColumnId;
};

export interface RunTableColumnConfig {
	id: ColumnId;
	accessor: (data: RunData) => number | null;
	header: string;
	variant: BadgeVariants;
	resultProperties?: RESULT_PROPERTIES[];
	results: RESULT_TYPE[];
	icon?: ReactNode;
}
