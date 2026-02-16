/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { DashboardCellArray } from '@/shared/types';

import { CellText } from './cell-text.component';

export interface CellArrayProps {
	data: DashboardCellArray[];
}

export const CellList = ({ data }: CellArrayProps) => {
	const string = data
		.map((val) => val?.value)
		.filter(Boolean)
		.join(', ');

	return <CellText value={string} />;
};
