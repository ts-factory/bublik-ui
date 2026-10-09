/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { Table } from '@tanstack/react-table';

import { ColumnsVisibility } from '@/shared/tailwind-ui';

import { columnPickerItems } from './classification-table.component';

export interface ClassificationColumnsPickerProps<T> {
	table: Table<T>;
	columnOrder: readonly string[];
	onColumnOrderChange: (order: string[]) => void;
}

/**
 * The column picker shared by the classification tables: one list that both
 * shows and orders the columns, listed in the table's own left-to-right order
 * so dragging a row up moves the column left.
 */
export function ClassificationColumnsPicker<T>({
	table,
	columnOrder,
	onColumnOrderChange
}: ClassificationColumnsPickerProps<T>) {
	const items = columnPickerItems(table, columnOrder);

	return (
		<ColumnsVisibility
			items={items}
			onColumnToggle={(id, checked) =>
				table.getColumn(id)?.toggleVisibility(checked)
			}
			sortable
			onReorder={(orderedIds) => {
				// The list holds only the movable columns; the pinned ones keep
				// their ends when the order is reconciled on the way in.
				const movable = new Set(orderedIds);
				const pinned = columnOrder.filter((id) => !movable.has(id));
				const firstMovable = columnOrder.findIndex((id) => movable.has(id));
				const before = pinned.filter(
					(id) => columnOrder.indexOf(id) < firstMovable
				);
				const after = pinned.filter(
					(id) => columnOrder.indexOf(id) >= firstMovable
				);

				onColumnOrderChange([...before, ...orderedIds, ...after]);
			}}
		/>
	);
}
