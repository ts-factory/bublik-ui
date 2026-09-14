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
	Separator,
	ToggleGroupItem,
	ToggleGroupRoot,
	Tooltip,
	cn
} from '@/shared/tailwind-ui';

import { useExpandUnexpected } from './hooks';
import {
	getAllTestIds,
	getExpandedUnexpectedState,
	getPackageIdsWithUnexpected,
	hasUnexpected
} from './utils';
import { ColumnId, GlobalFilterValue } from './types';
import { useRunTableRowState } from '../hooks';

type NokMode = 'preview' | 'open' | '';

function isSameGlobalFilter(
	a: GlobalFilterValue[],
	b: GlobalFilterValue[]
): boolean {
	if (a.length !== b.length) return false;

	return a.every((left) =>
		b.some(
			(right) => right.rowId === left.rowId && right.columnId === left.columnId
		)
	);
}

// Disabled ButtonTw draws a 1px inset ring on all sides. For the joined NOK
// items, drop the ring on shared edges so the separators are the only lines
// there. Kept as literal strings so Tailwind can pick the classes up.
const DISABLED_RING_START_ITEM =
	'disabled:shadow-[inset_1px_0_0_0_hsl(var(--colors-border-primary)),inset_0_1px_0_0_hsl(var(--colors-border-primary)),inset_0_-1px_0_0_hsl(var(--colors-border-primary))]';
const DISABLED_RING_MIDDLE_ITEM =
	'disabled:shadow-[inset_0_1px_0_0_hsl(var(--colors-border-primary)),inset_0_-1px_0_0_hsl(var(--colors-border-primary))]';

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
	const { rowState } = useRunTableRowState();
	const { showUnexpected, expandUnexpected, reset, unexpectedGlobalFilter } =
		useExpandUnexpected({ table });

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

	const handleResetColumns = () => {
		trackEvent(analyticsEventNames.runTableToolbarReset, {
			source: 'toolbar',
			target: 'columns'
		});

		table.setColumnVisibility(defaultColumnVisibility);
		onColumnOrderChange(defaultColumnOrder);
	};

	const handleResetNok = () => {
		trackEvent(analyticsEventNames.runTableToolbarReset, {
			source: 'toolbar',
			target: 'nok'
		});

		reset();
	};

	const tableHasUnexpected = useMemo(
		() =>
			table
				.getPreFilteredRowModel()
				.flatRows.map((row) => row.original)
				.some(hasUnexpected),
		[table]
	);

	// An item is lit only while the table is in the exact state that command
	// produces. Both commands set the root unexpected global filter and expand
	// every package with unexpected results; "Preview NOK" then collapses all
	// tests, while "Open NOK" expands every unexpected test with its result
	// requests. Collapsing one of those rows by hand, or changing the filter via
	// a package badge, therefore turns the highlight off. All of this lives in
	// URL query params, so it survives reloads.
	const globalFilter: GlobalFilterValue[] = table.getState().globalFilter ?? [];
	const expanded = table.getState().expanded;
	const isNokFilterActive =
		unexpectedGlobalFilter.length > 0 &&
		isSameGlobalFilter(globalFilter, unexpectedGlobalFilter);

	const nokMode = useMemo<NokMode>(() => {
		if (!isNokFilterActive) return '';

		const isExpanded = (id: string) =>
			expanded === true || Boolean(expanded[id]);

		if (!getPackageIdsWithUnexpected(table).every(isExpanded)) return '';

		const [, unexpectedTestIds] = getExpandedUnexpectedState(table);
		const isOpen =
			unexpectedTestIds.length > 0 &&
			unexpectedTestIds.every((id) => {
				const requests = rowState[id]?.requests;

				return (
					isExpanded(id) && Boolean(requests && Object.keys(requests).length)
				);
			});

		if (isOpen) return 'open';

		const isPreview = getAllTestIds(table).every((id) => !isExpanded(id));

		return isPreview ? 'preview' : '';
	}, [expanded, isNokFilterActive, rowState, table]);

	// Radix reports '' when the active item is clicked again. Both items are
	// idempotent commands, so re-apply the current mode instead of clearing it
	// (clearing is what Reset is for).
	const handleNokModeChange = (value: string) => {
		const mode = value === '' ? nokMode : value;

		if (mode === 'preview') {
			trackEvent(analyticsEventNames.runTableToolbarPreviewNok, {
				hasUnexpected: tableHasUnexpected
			});

			showUnexpected();
			return;
		}

		if (mode === 'open') {
			trackEvent(analyticsEventNames.runTableToolbarOpenNok, {
				hasUnexpected: tableHasUnexpected
			});

			expandUnexpected();
		}
	};

	return (
		<div className="flex gap-3">
			<div className="flex items-stretch">
				<ColumnsVisibility
					items={items}
					onColumnToggle={handleColumnToggle}
					sortable
					onReorder={handleReorder}
					onOpenChange={handleColumnsOpenChange}
					triggerClassName="rounded-r-none"
				/>
				<Separator orientation="vertical" className="h-auto" />
				<Tooltip content="Reset columns to default">
					<ButtonTw
						variant="secondary"
						size="xss"
						className="rounded-l-none"
						aria-label="Reset columns"
						onClick={handleResetColumns}
					>
						<Icon
							name="Refresh"
							size={20}
							style={{ transform: 'scaleX(-1)' }}
						/>
					</ButtonTw>
				</Tooltip>
			</div>
			<div className="flex items-stretch">
				<ToggleGroupRoot
					type="single"
					value={nokMode}
					onValueChange={handleNokModeChange}
					disabled={!tableHasUnexpected}
					aria-label="Unexpected results mode"
					className="flex items-stretch"
				>
					<Tooltip content="Preview rows containing not expected results">
						<ToggleGroupItem value="preview" asChild>
							<ButtonTw
								variant="secondary"
								size="xss"
								state={nokMode === 'preview' ? 'active' : 'default'}
								className={cn('rounded-r-none', DISABLED_RING_START_ITEM)}
							>
								<Icon name="EyeShow" size={20} className="mr-1.5" />
								Preview NOK
							</ButtonTw>
						</ToggleGroupItem>
					</Tooltip>
					<Separator orientation="vertical" className="h-auto" />
					<Tooltip content="Open rows containing not expected results">
						<ToggleGroupItem value="open" asChild>
							<ButtonTw
								variant="secondary"
								size="xss"
								state={nokMode === 'open' ? 'active' : 'default'}
								className={cn('rounded-none', DISABLED_RING_MIDDLE_ITEM)}
							>
								<Icon name="Scan" size={20} className="mr-1.5" />
								Open NOK
							</ButtonTw>
						</ToggleGroupItem>
					</Tooltip>
				</ToggleGroupRoot>
				<Separator orientation="vertical" className="h-auto" />
				<Tooltip content="Reset filters, sorting and expanded rows">
					<ButtonTw
						variant="secondary"
						size="xss"
						className="rounded-l-none"
						aria-label="Reset unexpected results view"
						onClick={handleResetNok}
					>
						<Icon
							name="Refresh"
							size={20}
							style={{ transform: 'scaleX(-1)' }}
						/>
					</ButtonTw>
				</Tooltip>
			</div>
		</div>
	);
};
