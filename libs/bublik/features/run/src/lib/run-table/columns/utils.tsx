/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ColumnDef } from '@tanstack/react-table';

import { RunData } from '@/shared/types';

import { RunTableColumnConfig } from '../types';
import { TableBadgeModel } from '../components';
import { TableHeader } from '../components/table-header';

export const createRunColumn = (
	config: RunTableColumnConfig
): ColumnDef<RunData> => {
	return {
		accessorFn: config.accessor,
		id: config.id,
		header: () => <TableHeader header={config.header} icon={config.icon} />,
		cell: ({ getValue, row, table }) => {
			const value = getValue<string | number>();

			return (
				<TableBadgeModel
					variant={config.variant}
					columnId={config.id}
					results={config.results}
					resultProperties={config.resultProperties}
					table={table}
					row={row}
					value={value}
				/>
			);
		}
	};
};
