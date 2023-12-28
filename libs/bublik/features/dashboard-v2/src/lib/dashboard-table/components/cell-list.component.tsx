/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { DashboardCellArray } from '@/shared/types';
import { Tooltip } from '@/shared/tailwind-ui';

export interface CellArrayProps {
	data: DashboardCellArray[];
}

export const CellList = ({ data }: CellArrayProps) => {
	const string = data
		.map((val) => val?.value)
		.filter(Boolean)
		.join(', ');

	return (
		<Tooltip content={string}>
			<span className="truncate">{string}</span>
		</Tooltip>
	);
};
