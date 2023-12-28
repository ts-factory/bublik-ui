/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ColumnDef } from '@tanstack/react-table';

import { RunData } from '@/shared/types';
import { TableNode } from '@/shared/tailwind-ui';
import { getTreeNode } from '@/bublik/run-utils';

import { ColumnId } from '../types';

export const treeColumn: ColumnDef<RunData> = {
	id: ColumnId.Tree,
	accessorFn: getTreeNode,
	header: 'Tree',
	cell: ({ getValue, row }) => {
		const node = getValue<ReturnType<typeof getTreeNode>>();

		if (!node) return null;

		const { name, type } = node;

		return (
			<TableNode
				nodeName={name}
				nodeType={type}
				onClick={() => row.toggleExpanded()}
				isExpanded={row.getIsExpanded()}
				depth={row.depth}
			/>
		);
	},
	enableSorting: false
};
