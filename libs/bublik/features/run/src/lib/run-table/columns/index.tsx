/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { RunData } from '@/shared/types';
import { createColumnHelper } from '@tanstack/react-table';

import { treeColumn } from './tree-column';
import { badgeColumns } from './badge-columns';
import { ColumnId } from '../types';

const helper = createColumnHelper<RunData>();

const columns = [
	treeColumn,
	helper.accessor('objective', {
		id: ColumnId.Objective,
		header: 'Objective',
		cell: ({ cell }) => {
			const objective = cell.getValue();

			return objective;
		}
	}),
	...badgeColumns
];

export { columns };
