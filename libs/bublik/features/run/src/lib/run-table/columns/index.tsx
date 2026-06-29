/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useState } from 'react';
import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { PopoverPortal } from '@radix-ui/react-popover';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { skipToken } from '@reduxjs/toolkit/query';
import { To } from 'react-router-dom';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { MergedRun, NodeEntity, RunData, RunStatsColumn } from '@/shared/types';
import { useGetRunDetailsQuery } from '@/services/bublik-api';
import {
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Icon,
	Popover,
	PopoverTrigger,
	Separator,
	TableNode
} from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
import { getTreeNode } from '@/bublik/run-utils';
import { HistorySearchBuilder } from '@/shared/utils';
import { stringifySearch } from '@/router';

import { badgeColumns } from './badge-columns';
import { TestComments } from '../components/test-comments';
import { ColumnId } from '../types';
import {
	buildColumnGroups,
	COLUMN_GROUPS,
	createDefaultColumnOrder
} from '../constants';

function getHistoryViewLink(
	path: string[],
	runIds: number[],
	maybeDate?: string
): To {
	const query = new HistorySearchBuilder(path.join('/')).withRunIds(runIds);
	if (maybeDate) query.withAnchorDate(maybeDate);

	return { pathname: '/history', search: stringifySearch(query.build()) };
}

interface HistoryRunLinksDropdownMenuProps {
	runIds: number[];
	path: string[];
}

function HistoryRunLinksDropdownMenu(props: HistoryRunLinksDropdownMenuProps) {
	const { runIds, path } = props;
	const [open, setOpen] = useState(false);
	const { data } = useGetRunDetailsQuery(props.runIds?.[0] ?? skipToken);
	const historyLink = getHistoryViewLink(path, runIds, data?.finish);

	return (
		<DropdownMenu
			onOpenChange={(nextOpen) => {
				if (nextOpen) {
					trackEvent(analyticsEventNames.runTableHistoryLinkClick, {
						action: 'open_menu',
						runCount: runIds.length
					});
				}

				setOpen(nextOpen);
			}}
		>
			<DropdownMenuTrigger asChild>
				<button
					className={cn(
						'inline-flex items-center justify-center transition-all appearance-none select-none text-[0.6875rem] font-semibold leading-[0.875rem] max-h-[26px] rounded-md hover:shadow-[inset_0_0_0_2px_#94b0ff]',
						'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
						'disabled:shadow-[inset_0_0_0_1px_hsl(var(--colors-border-primary))] disabled:bg-white disabled:hover:bg-white disabled:text-border-primary',
						'p-[3px]',
						open
							? 'bg-primary text-white'
							: 'hover:bg-primary-wash text-primary'
					)}
				>
					<Icon name="ArrowShortTop" size={18} className={cn('rotate-180')} />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				<DropdownMenuLabel>Open Direct Search</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<LinkWithProject
						to={historyLink}
						className="pl-2"
						onClick={() => {
							trackEvent(analyticsEventNames.runTableHistoryLinkClick, {
								action: 'open_history_view',
								runCount: runIds.length
							});
						}}
					>
						<Icon
							name="BoxArrowRight"
							size={20}
							className="mr-2 text-primary"
						/>
						<span>History View Of Results In The Run</span>
					</LinkWithProject>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

interface GetColumnsOptions {
	projectId?: number;
	runIds?: number[];
	defaultColumns?: RunStatsColumn[];
	columnOrder?: ColumnId[];
}

function groupColumnsByOrder(
	columns: ColumnDef<RunData | MergedRun>[],
	helper: ReturnType<typeof createColumnHelper<RunData | MergedRun>>
) {
	const columnsById = new Map(
		columns.map((column) => [column.id as ColumnId, column])
	);

	return buildColumnGroups(columns.map((column) => column.id as ColumnId)).map(
		({ id, columnIds }) => {
			const group = COLUMN_GROUPS.find((group) =>
				group.columns.includes(columnIds[0])
			);

			return helper.group({
				id,
				header: () => group?.label,
				columns: columnIds.flatMap((columnId) => {
					const column = columnsById.get(columnId);

					return column ? [column] : [];
				}),
				meta: { className: group?.className }
			});
		}
	);
}

function getColumns({
	projectId,
	runIds,
	defaultColumns,
	columnOrder
}: GetColumnsOptions) {
	const helper = createColumnHelper<RunData | MergedRun>();

	const treeColumn: ColumnDef<RunData> = {
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
					onClick={() => {
						trackEvent(analyticsEventNames.runTableTreeToggle, {
							nodeType: type,
							action: row.getIsExpanded() ? 'collapse' : 'expand'
						});

						row.toggleExpanded();
					}}
					isExpanded={row.getIsExpanded()}
					depth={row.depth}
					trailing={
						runIds && runIds.length === 1 && type === NodeEntity.Test ? (
							<HistoryRunLinksDropdownMenu
								runIds={runIds}
								path={row.original.path}
							/>
						) : null
					}
				/>
			);
		},
		enableSorting: false
	};

	const columns = [
		treeColumn,
		helper.accessor('objective', {
			id: ColumnId.Objective,
			header: 'Objective',
			cell: ({ cell }) => {
				const objective = cell.getValue();

				if (!objective) return;

				return (
					<Popover modal>
						<PopoverTrigger asChild>
							<button className="max-w-[15vw] 2xl:max-w-[20vw] text-left w-full group relative block h-full hover:bg-primary-wash px-2">
								<div className="absolute flex items-center right-0 top-1/2 -translate-y-1/2 z-10 h-full opacity-0 group-hover:opacity-100 transition-opacity">
									<div className="w-6 h-full bg-gradient-to-r from-transparent to-white" />
									<div className="grid place-items-center bg-white w-6 h-full pr-2">
										<Icon
											name="ChevronDown"
											size={16}
											className="text-primary"
										/>
									</div>
								</div>
								<pre className="truncate relative text-xs block max-w-[80ch] font-body">
									{objective}
								</pre>
							</button>
						</PopoverTrigger>
						<PopoverPortal>
							<PopoverPrimitive.Content
								align="start"
								sideOffset={0}
								className={cn(
									'outline-none bg-white shadow-popover p-1 rounded-lg z-50 -translate-y-[26px] -translate-x-[8px] transition-none',
									'rdx-state-open:animate-fade-in rdx-state-closed:animate-fade-out'
								)}
								style={{ transform: 'translateY(-74px) translateX(-4px)' }}
							>
								<h2 className="px-2 py-1.5 font-semibold text-xs">Objective</h2>
								<Separator className="h-px my-1" />
								<pre className="p-2 text-xs font-body">{objective}</pre>
							</PopoverPrimitive.Content>
						</PopoverPortal>
					</Popover>
				);
			},
			meta: { className: 'w-px px-0' }
		}),
		helper.accessor('comments', {
			id: ColumnId.Comments,
			header: () => <div className="px-2 text-left">Notes</div>,
			cell: ({ cell, row }) => {
				const comments = cell.getValue();

				if (!projectId) return null;
				if (!('result_id' in row.original)) return null;

				return (
					<TestComments
						comments={comments}
						testId={row.original.test_id}
						projectId={projectId}
					/>
				);
			},
			enableSorting: false,
			meta: { className: 'text-right w-px px-0' }
		}),
		...badgeColumns
	] as ColumnDef<RunData | MergedRun>[];
	const columnsById = new Map(
		columns.map((column) => [column.id as ColumnId, column])
	);
	const resolvedColumnOrder =
		columnOrder && columnOrder.length > 0
			? columnOrder
			: createDefaultColumnOrder(defaultColumns);
	const orderedColumns = resolvedColumnOrder.flatMap((columnId) => {
		const column = columnsById.get(columnId);

		return column ? [column] : [];
	});

	return groupColumnsByOrder(orderedColumns, helper);
}

export { getColumns };
