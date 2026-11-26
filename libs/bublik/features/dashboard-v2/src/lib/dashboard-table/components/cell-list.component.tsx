/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { DashboardCellArray } from '@/shared/types';

import { CellText } from './cell-text.component';

export interface CellArrayProps {
	data: DashboardCellArray[];
	/** The column's name and the row's run, for the popover of a cut list. */
	heading?: string;
	runId?: number;
}

export const CellList = ({ data, heading, runId }: CellArrayProps) => {
	const string = data
		.map((val) => val?.value)
		.filter(Boolean)
		.join(', ');

	return <CellText value={string} heading={heading} runId={runId} />;
};
