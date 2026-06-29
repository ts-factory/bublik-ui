/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode, useMemo } from 'react';
import { Table, VisibilityState } from '@tanstack/react-table';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { MergedRun, RunData } from '@/shared/types';
import { toolbarIcon } from '@/bublik/run-utils';
import {
	ButtonTw,
	ColumnReorderChange,
	ColumnsVisibility,
	ColumnVisibilityItem,
	Icon,
	Tooltip
} from '@/shared/tailwind-ui';

import { useExpandUnexpected } from './hooks';
import { hasUnexpected } from './utils';
import { ColumnId } from './types';
import { useGlobalRequirements } from '../hooks';

function getColumnLabel(columnId: string): string {
	return columnId
		.toLowerCase()
		.replace(/_/g, ' ')
		.replace(/ expected$| unexpected$/i, '')
		.replace(/\b\w/g, (c) => c.toUpperCase())
		.trim();
}

function getColumnIcon(columnId: string): ReactNode {
	const id = columnId.toLowerCase();

	if (id.includes('unexpected')) return toolbarIcon['unexpected'];
	if (id.includes('expected')) return toolbarIcon['expected'];
	if (id.includes('abnormal')) return toolbarIcon['abnormal'];

	return null;
}

export interface ToolbarProps {
	table: Table<RunData | MergedRun>;
	defaultColumnVisibility: VisibilityState;
	columnOrder: ColumnId[];
	defaultColumnOrder: ColumnId[];
	onColumnOrderChange: (order: ColumnId[]) => void;
}

export const Toolbar = ({
	table,
	defaultColumnVisibility,
	columnOrder,
	defaultColumnOrder,
	onColumnOrderChange
}: ToolbarProps) => {
	const { resetGlobalRequirements } = useGlobalRequirements();
	const { showUnexpected, expandUnexpected, reset } = useExpandUnexpected({
		table
	});

	const sortableColumnIds = useMemo<ColumnId[]>(
		() => columnOrder.filter((id) => id !== ColumnId.Tree),
		[columnOrder]
	);

	const items: ColumnVisibilityItem[] = sortableColumnIds.flatMap((id) => {
		const column = table.getColumn(id);

		if (!column) return [];

		return [
			{
				id,
				label: getColumnLabel(id),
				icon: getColumnIcon(id),
				checked: column.getIsVisible()
			}
		];
	});

	const handleColumnToggle = (id: string, isVisible: boolean) => {
		trackEvent(analyticsEventNames.runTableToolbarColumnVisibilityToggle, {
			columnId: id,
			visible: isVisible
		});

		table.getColumn(id)?.toggleVisibility(isVisible);
	};

	const handleReorder = (orderedIds: string[], change: ColumnReorderChange) => {
		trackEvent(analyticsEventNames.runTableToolbarColumnReorder, {
			columnId: change.activeId,
			fromIndex: change.fromIndex,
			toIndex: change.toIndex
		});

		onColumnOrderChange([ColumnId.Tree, ...(orderedIds as ColumnId[])]);
	};

	const handleColumnsOpenChange = (open: boolean) => {
		if (open) {
			trackEvent(analyticsEventNames.runTableToolbarColumnsOpen, {
				source: 'columns_dropdown'
			});
		}
	};

	const handleResetState = () => {
		trackEvent(analyticsEventNames.runTableToolbarReset, {
			source: 'toolbar'
		});

		table.setColumnVisibility(defaultColumnVisibility);
		onColumnOrderChange(defaultColumnOrder);
		reset();
		resetGlobalRequirements();

		const rootRowId = table.getCoreRowModel().flatRows?.[0]?.id;
		if (rootRowId) table.setExpanded({ [rootRowId]: true });
	};

	const tableHasUnexpected = useMemo(
		() =>
			table
				.getPreFilteredRowModel()
				.flatRows.map((row) => row.original)
				.some(hasUnexpected),
		[table]
	);

	return (
		<div className="flex gap-3">
			<ColumnsVisibility
				items={items}
				onColumnToggle={handleColumnToggle}
				sortable
				onReorder={handleReorder}
				onOpenChange={handleColumnsOpenChange}
			/>
			<Tooltip content="Preview rows containing not expected results">
				<ButtonTw
					variant="secondary"
					state={!tableHasUnexpected ? 'disabled' : 'default'}
					size="xss"
					onClick={() => {
						trackEvent(analyticsEventNames.runTableToolbarPreviewNok, {
							hasUnexpected: tableHasUnexpected
						});

						showUnexpected();
					}}
				>
					<Icon name="EyeShow" size={20} className="mr-1.5" />
					Preview NOK
				</ButtonTw>
			</Tooltip>
			<Tooltip content="Open rows containing not expected resutls">
				<ButtonTw
					variant="secondary"
					state={!tableHasUnexpected ? 'disabled' : 'default'}
					size="xss"
					onClick={() => {
						trackEvent(analyticsEventNames.runTableToolbarOpenNok, {
							hasUnexpected: tableHasUnexpected
						});

						expandUnexpected();
					}}
				>
					<Icon name="Scan" size={20} className="mr-1.5" />
					Open NOK
				</ButtonTw>
			</Tooltip>
			<Tooltip content="Reset table to default state">
				<ButtonTw variant="secondary" size="xss" onClick={handleResetState}>
					<Icon
						name="Refresh"
						size={20}
						className="mr-1.5"
						style={{ transform: 'scaleX(-1)' }}
					/>
					Reset
				</ButtonTw>
			</Tooltip>
		</div>
	);
};
