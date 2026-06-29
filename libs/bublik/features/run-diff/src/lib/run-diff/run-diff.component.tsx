/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, Fragment, ReactNode, useMemo } from 'react';
import {
	ExpandedState,
	flexRender,
	getCoreRowModel,
	getExpandedRowModel,
	OnChangeFn,
	Row,
	Table,
	TableState,
	useReactTable,
	VisibilityState
} from '@tanstack/react-table';

import { NodeEntity, RunData } from '@/shared/types';
import {
	ColumnsVisibility,
	ColumnVisibilityItem,
	Skeleton,
	TooltipProvider,
	cn
} from '@/shared/tailwind-ui';
import { toolbarIcon } from '@/bublik/run-utils';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';

import { DiffType, MergedRunDataWithDiff } from './run-diff.types';
import { computeDiff, getRowCanExpand } from './run-diff.utils';
import { mergedColumns } from './run-diff.columns';

export interface VisibilityProps {
	table: Table<MergedRunDataWithDiff>;
}

const DiffToolbar = ({ table }: VisibilityProps) => {
	const items: ColumnVisibilityItem[] = table
		.getAllLeafColumns()
		.filter(
			(column) =>
				!column.id.startsWith('GUTTER') &&
				!column.id.startsWith('NAME') &&
				column.id.includes('_LEFT')
		)
		.map((leftColumn) => {
			const rightColumn = table.getColumn(
				leftColumn.id.replace('_LEFT', '_RIGHT')
			);

			const id = leftColumn.id.toLowerCase();
			const icon = id.includes('unexpected')
				? toolbarIcon['unexpected']
				: id.includes('expected')
				? toolbarIcon['expected']
				: id.includes('abnormal')
				? toolbarIcon['abnormal']
				: undefined;

			const label = `${leftColumn.id.charAt(0).toUpperCase()}${leftColumn.id
				.replace('_LEFT', '')
				.slice(1)
				.toLowerCase()}`
				.split('_')
				.join(' ')
				.replace(/expected|unexpected/i, '');

			return {
				id: leftColumn.id,
				label,
				icon,
				checked: Boolean(
					leftColumn.getIsVisible() && rightColumn?.getIsVisible()
				)
			};
		});

	const handleToggle = (id: string, checked: boolean) => {
		table.getColumn(id)?.toggleVisibility(checked);
		table.getColumn(id.replace('_LEFT', '_RIGHT'))?.toggleVisibility(checked);
	};

	return (
		<div className="flex items-center justify-between px-4 py-1 mb-1 bg-white rounded">
			<span className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem]">
				Toolbar
			</span>
			<div className="flex items-center gap-2">
				<ColumnsVisibility
					items={items}
					onColumnToggle={handleToggle}
					label="Column Visibility"
					triggerIconName="DashboardModeColumns"
				/>
			</div>
		</div>
	);
};

export const RunDiffLoading = () => {
	return <Skeleton className="rounded h-[30vh] w-full" />;
};

export interface RunDiffErrorProps {
	error: unknown;
}

export const RunDiffError: FC<RunDiffErrorProps> = ({ error = {} }) => {
	return <BublikErrorState error={error} iconSize={48} />;
};

export const RunDiffEmpty = () => {
	return (
		<BublikEmptyState
			title="No data found"
			description="No data available to compare selected runs"
		/>
	);
};

export interface RunDiffProps {
	leftRoot: RunData;
	rightRoot: RunData;
	renderSubComponent: (props: { row: Row<MergedRunDataWithDiff> }) => ReactNode;
	expanded: ExpandedState;
	onExpandedChange: OnChangeFn<ExpandedState>;
	onColumnVisibilityChange: OnChangeFn<VisibilityState>;
	columnVisibility: VisibilityState;
}

export const RunDiff: FC<RunDiffProps> = ({
	leftRoot,
	rightRoot,
	renderSubComponent,
	expanded,
	onExpandedChange,
	columnVisibility,
	onColumnVisibilityChange
}) => {
	const { merge } = useMemo(
		() => computeDiff({ leftRoot, rightRoot }),
		[leftRoot, rightRoot]
	);

	const state = useMemo<Partial<TableState>>(
		() => ({ expanded, columnVisibility }),
		[columnVisibility, expanded]
	);

	const table = useReactTable<MergedRunDataWithDiff>({
		data: merge,
		state,
		columns: mergedColumns,
		getCoreRowModel: getCoreRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		getSubRows: (row) => row.children,
		onExpandedChange,
		onColumnVisibilityChange,
		getRowCanExpand
	});

	return (
		<>
			<DiffToolbar table={table} />
			<TooltipProvider disableHoverableContent>
				<table className="w-full bg-white border-separate rounded border-spacing-y-0">
					<thead className="sticky top-0 z-20 bg-white">
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id} className="h-8.5">
								{headerGroup.headers.map((header) => (
									<th
										key={header.id}
										colSpan={header.colSpan}
										className={cn(
											'p-0 text-left border-b border-b-border-primary uppercase',
											header.column.columnDef.meta?.className
										)}
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext()
											  )}
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody>
						{table.getRowModel().rows.map((row, idx, arr) => {
							const diffType = row.original.diffType;
							const isTest =
								row.original.left?.type === NodeEntity.Test ||
								row.original.right?.type === NodeEntity.Test;
							const isExpanded = row.getIsExpanded() && isTest;

							const isAdded = diffType === DiffType.ADDED;
							const isRemoved = diffType === DiffType.REMOVED;
							const isChanged = diffType === DiffType.CHANGED;

							const rowClassName = cn(
								'h-8.5 bg-white',
								isAdded && 'bg-diff-added',
								isRemoved && 'bg-diff-removed',
								isChanged && 'bg-yellow-50',
								isExpanded && 'sticky top-[34px] z-20'
							);

							return (
								<Fragment key={row.id}>
									{/* Normal ROW */}
									<tr className={rowClassName}>
										{row.getVisibleCells().map((cell) => (
											<td
												key={cell.id}
												className={cn(
													'font-medium text-[0.75rem] p-0',
													idx !== arr.length - 1 &&
														'border-b border-b-border-primary',
													cell.column.columnDef.meta?.className
												)}
											>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext()
												)}
											</td>
										))}
									</tr>
									{/* EXPANDED SUBCOMPONENT */}
									{isExpanded && (
										<tr>
											<td
												colSpan={row.getVisibleCells().length}
												className="p-0"
											>
												<div>{renderSubComponent({ row })}</div>
											</td>
										</tr>
									)}
								</Fragment>
							);
						})}
					</tbody>
				</table>
			</TooltipProvider>
		</>
	);
};
