/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, Fragment, ReactNode, useMemo, useState } from 'react';
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
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuTrigger,
	Icon,
	Separator,
	Skeleton,
	TooltipProvider,
	cn,
	ButtonTw
} from '@/shared/tailwind-ui';
import { getErrorMessage } from '@/services/bublik-api';
import { toolbarIcon } from '@/bublik/run-utils';

import { DiffType, MergedRunDataWithDiff } from './run-diff.types';
import { computeDiff, getRowCanExpand } from './run-diff.utils';
import { mergedColumns } from './run-diff.columns';

export interface VisibilityProps {
	table: Table<MergedRunDataWithDiff>;
}

const ColumnsVisibility = ({ table }: VisibilityProps) => {
	const [isVisible, setIsVisible] = useState(false);

	return (
		<div className="flex items-center justify-between px-4 py-1 mb-1 bg-white rounded">
			<span className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem]">
				Toolbar
			</span>
			<div className="flex items-center gap-2">
				<DropdownMenu open={isVisible}>
					<DropdownMenuTrigger asChild onClick={() => setIsVisible(true)}>
						<ButtonTw
							variant="secondary"
							size="xss"
							state={isVisible && 'active'}
						>
							Columns
							<Icon name="ArrowShortSmall" className="ml-1.5" />
						</ButtonTw>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						onInteractOutside={() => setIsVisible(false)}
						onEscapeKeyDown={() => setIsVisible(false)}
						collisionPadding={{ right: 15 }}
						className="w-56"
					>
						<DropdownMenuLabel className="text-xs">
							Column Visibility
						</DropdownMenuLabel>
						<Separator className="h-px my-1 -mx-1" />
						{table
							.getAllLeafColumns()
							.filter((column) => {
								return (
									!column.id.startsWith('GUTTER') &&
									!column.id.startsWith('NAME') &&
									column.id.includes('_LEFT')
								);
							})
							.map((leftColumn) => {
								const rightColumn = table.getColumn(
									leftColumn.id.replace('_LEFT', '_RIGHT')
								);

								const handleChange = (isChecked: boolean) => {
									leftColumn.toggleVisibility(isChecked);
									rightColumn?.toggleVisibility(isChecked);
								};

								const icon = leftColumn.id.toLowerCase().includes('unexpected')
									? toolbarIcon['unexpected']
									: leftColumn.id.toLowerCase().includes('expected')
										? toolbarIcon['expected']
										: leftColumn.id.toLowerCase().includes('abnormal')
											? toolbarIcon['abnormal']
											: null;

								return (
									<DropdownMenuCheckboxItem
										key={leftColumn.id}
										checked={
											leftColumn.getIsVisible() && rightColumn?.getIsVisible()
										}
										onCheckedChange={handleChange}
										className="text-xs"
									>
										{`${leftColumn.id.charAt(0).toUpperCase()}${leftColumn.id
											.replace('_LEFT', '')
											.slice(1)
											.toLowerCase()}`
											.split('_')
											.join(' ')
											.replace(/expected|unexpected/i, '')}
										{icon}
									</DropdownMenuCheckboxItem>
								);
							})}
					</DropdownMenuContent>
				</DropdownMenu>
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
	const { status, title, description } = getErrorMessage(error);

	return (
		<div className="flex items-center justify-center gap-4 mx-4 my-72">
			<Icon
				name="TriangleExclamationMark"
				size={48}
				className="text-text-unexpected"
			/>
			<div>
				<h2 className="text-2xl font-bold">
					{status} {title}
				</h2>
				<p>{description}</p>
			</div>
		</div>
	);
};

export const RunDiffEmpty = () => {
	return <div>No data found!</div>;
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
			<ColumnsVisibility table={table} />
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
