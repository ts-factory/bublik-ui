/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { useCallback, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { BooleanParam, useQueryParam, withDefault } from 'use-query-params';
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable
} from '@tanstack/react-table';

import {
	Badge,
	ButtonTw,
	CardHeader,
	cn,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Icon,
	Separator,
	Spinner,
	Tooltip
} from '@/shared/tailwind-ui';
import {
	NotProcessedPoint,
	ReportRoot,
	RunDetailsAPIResponse,
	TestBlock
} from '@/shared/types';
import { LinkWithProject } from '@/bublik/features/projects';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';
import { useMount } from '@/shared/hooks';

import { RunReportHeader } from './run-report-header';
import { RunReportTestBlock } from './run-report-test';
import { WarningsHoverCard } from './run-report-warnings';
import { useEnablePairGainColumns } from './run-report-table/run-report-table.hooks';
import { RunReportArgs } from './run-report-args';

function scrollToItem(id: string) {
	const elem = document.getElementById(encodeURIComponent(id));
	const scroller = document.getElementById('page-container');
	const offset = Number(elem?.dataset.offset || 0);

	if (!scroller || !elem) {
		console.warn('Element or scroller not found', scroller, elem);
		return;
	}

	const elemRect = elem.getBoundingClientRect();
	const scrollerRect = scroller.getBoundingClientRect();

	const relativeTop = elemRect.top - scrollerRect.top;
	const targetScroll = scroller.scrollTop + relativeTop - offset;

	scroller.scrollTo({ top: targetScroll, behavior: 'smooth' });
}

interface TableOfContentsItem {
	type: string;
	id: string;
	label: string;
	children?: TableOfContentsItem[];
}

function generateTableOfContents(data: ReportRoot): TableOfContentsItem[] {
	return data.content
		.filter((b) => b.type === 'test-block')
		.map((t) => ({
			id: t.id,
			type: t.type,
			label: t.label,
			children: t.content.map((a) => ({
				id: a.id,
				label: a.label,
				type: a.type,
				children: a.content.map((c) => ({
					id: c.id,
					type: c.type,
					label: c.label,
					children: c.content.map((r) => ({
						id: r.id,
						label: r.label ?? '',
						type: r.type
					}))
				}))
			}))
		}));
}

interface RunReportTableOfContentsProps {
	contents: TableOfContentsItem[];
}

function RunReportTableOfContents({ contents }: RunReportTableOfContentsProps) {
	return (
		<div className="bg-white flex flex-col rounded">
			<CardHeader label="Table Of Contents" />
			<ul className="flex flex-col py-2">
				{contents.map((item, idx, arr) => {
					return (
						<li key={item.id}>
							<TableOfContentsItem item={item} />
							{idx < arr.length - 1 && (
								<Separator orientation="horizontal" className="my-2" />
							)}
						</li>
					);
				})}
			</ul>
		</div>
	);
}

interface TableOfContentsItemProps {
	item: TableOfContentsItem;
	depth?: number;
}

function TableOfContentsItem({ item, depth = 0 }: TableOfContentsItemProps) {
	const isOpenByDefault =
		item.type === 'arg-val-block' || item.type === 'test-block';
	const [open, setOpen] = useQueryParam(
		item.id,
		withDefault(BooleanParam, isOpenByDefault)
	);
	const [params] = useSearchParams();
	const configid = params.get('config');

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<div
				className={cn(
					'flex items-center gap-1 h-[22px] pr-2',
					// In case of an empty label, hide the item (argument values block might be empty)
					!item.label && 'hidden'
				)}
				style={{ paddingLeft: `${depth * 12 + 16}px` }}
			>
				<div className="border h-full rounded border-transparent px-1 hover:border-primary flex items-center gap-1 w-full">
					{item.children ? (
						<CollapsibleTrigger className="grid place-items-center p-0.5 rounded hover:bg-primary-wash hover:text-text-primary">
							<Icon
								name="ChevronDown"
								className={cn('size-3', open ? '' : '-rotate-90')}
							/>
						</CollapsibleTrigger>
					) : (
						<div className="size-4 rounded-full" />
					)}
					<LinkWithProject
						to={{
							search: `?config=${configid}`,
							hash: encodeURIComponent(item.id)
						}}
						className={cn(
							'text-text-primary leading-[0.875rem] font-medium text-[0.875rem]',
							item.type === 'test-block' || item.type === 'arg-val-block'
								? 'font-semibold'
								: 'font-medium'
						)}
						onClick={() => scrollToItem(item.id)}
					>
						{item.label}
					</LinkWithProject>
				</div>
			</div>
			{item.children && item.children.length ? (
				<CollapsibleContent asChild>
					<ul>
						{item.children.map((child) => (
							<li key={child.id}>
								<TableOfContentsItem item={child} depth={depth + 1} />
							</li>
						))}
					</ul>
				</CollapsibleContent>
			) : null}
		</Collapsible>
	);
}

interface RunReportProps {
	blocks: ReportRoot;
	details: RunDetailsAPIResponse;
	runId: number;
}

function RunReport(props: RunReportProps) {
	const { blocks, runId, details } = props;
	const location = useLocation();

	const testBlocks = useMemo(
		() => blocks.content.filter((b) => b.type === 'test-block'),
		[blocks.content]
	);
	const tableOfContents = useMemo(
		() => generateTableOfContents(blocks),
		[blocks]
	);

	useMount(() => {
		setTimeout(() => {
			const id = decodeURIComponent(location.hash.slice(1));
			scrollToItem(id);
		}, 0);
	});

	return (
		<div className="flex flex-col gap-1 relative">
			<RunReportHeader label="Info" details={details} runId={runId} />
			<ReportConfigurationFrame
				warnings={blocks.warnings}
				config={blocks.config}
			/>
			<RunReportTableOfContents contents={tableOfContents} />
			<RunReportContentList blocks={testBlocks} />
			<NotProcessedPointsTable points={blocks.unprocessed_iters} />
		</div>
	);
}

interface ReportConfigurationFrameProps {
	warnings: string[];
	config: ReportRoot['config'];
}

function ReportConfigurationFrame(props: ReportConfigurationFrameProps) {
	const { warnings, config } = props;
	const [searchParams] = useSearchParams();

	return (
		<div className="bg-white rounded-md flex flex-col">
			<CardHeader
				label={
					<div className="flex items-center gap-2">
						<span className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem]">
							Report Description
						</span>
						<WarningsHoverCard warnings={warnings} />
					</div>
				}
			>
				<ButtonTw asChild variant="secondary" size="xss">
					<LinkWithProject
						to={`/admin/config?configId=${searchParams.get('config')}`}
					>
						<Icon name="BoxArrowRight" className="mr-1.5" />
						Config
					</LinkWithProject>
				</ButtonTw>
			</CardHeader>
			<div className="p-4 flex flex-col gap-4">
				{warnings.length ? (
					<div className="bg-bg-fillError rounded-lg p-2.5 flex flex-col gap-2">
						<div className="flex items-start gap-4">
							<div className="grid place-items-center text-text-unexpected">
								<Icon
									name="TriangleExclamationMark"
									className="text-text-unexpected size-5"
								/>
							</div>
							<div className="flex flex-col gap-1.5">
								<h2 className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem]">
									Warnings:
								</h2>
								<ul className="pl-6 flex flex-col gap-1 whitespace-break-spaces list-disc">
									{warnings.map((warning) => (
										<li
											key={warning}
											className="overflow-wrap-anywhere text-[0.6875rem] font-medium leading-[0.875rem]"
										>
											{warning}
										</li>
									))}
								</ul>
							</div>
						</div>
					</div>
				) : null}
				<dl className="grid grid-cols-[max-content_48px_1fr] gap-y-2">
					<dd className="text-[0.6875rem] font-medium leading-[0.875rem] text-text-menu col-start-1">
						Name:
					</dd>
					<dt className="text-[0.6875rem] font-medium leading-[0.875rem] col-start-3">
						{config.name}
					</dt>
					<dd className="text-[0.6875rem] font-medium leading-[0.875rem] text-text-menu col-start-1">
						Version:
					</dd>
					<dt className="text-[0.6875rem] font-medium leading-[0.875rem] col-start-3">
						{config.version}
					</dt>
					<dd className="text-[0.6875rem] font-medium leading-[0.875rem] text-text-menu col-start-1">
						Description:
					</dd>
					<dt className="text-[0.6875rem] font-medium leading-[0.875rem] col-start-3">
						{config.description}
					</dt>
				</dl>
			</div>
		</div>
	);
}

const helper = createColumnHelper<NotProcessedPoint>();

const columns = [
	helper.accessor('test_name', {
		header: 'Test Name',
		meta: { className: 'text-xs' }
	}),
	helper.accessor('common_args', {
		header: 'Common Args',
		cell: ({ cell }) => {
			const commonArgs = cell.getValue();
			if (!commonArgs || !Object.keys(commonArgs).length) return;

			return (
				<ul className="flex flex-wrap gap-1">
					{Object.entries(commonArgs).map(([name, value]) => (
						<li key={`${name}_${value}`}>
							<Badge className="bg-badge-1">
								{name}: {value}
							</Badge>
						</li>
					))}
				</ul>
			);
		}
	}),
	helper.accessor('args_vals', {
		header: 'Args',
		cell: ({ cell }) => {
			const args = cell.getValue();

			return (
				<ul className="flex flex-wrap gap-1">
					{Object.entries(args).map(([name, value]) => (
						<li key={`${name}_${value}`}>
							<Badge className="bg-badge-1">
								{name}: {value}
							</Badge>
						</li>
					))}
				</ul>
			);
		}
	}),
	helper.accessor('reasons', {
		header: 'Reasons',
		cell: ({ cell }) => {
			const reasons = cell.getValue();

			return (
				<ul>
					{reasons.map((reason) => (
						<li className="text-xs">{reason}</li>
					))}
				</ul>
			);
		}
	})
];

interface NotProcessedPointsTableProps {
	points: NotProcessedPoint[];
}

function NotProcessedPointsTable({ points }: NotProcessedPointsTableProps) {
	const table = useReactTable({
		columns,
		data: points,
		getCoreRowModel: getCoreRowModel()
	});

	if (points.length === 0) return null;

	return (
		<div className="bg-white rounded-md">
			<CardHeader label="Not Processed Iterations" />
			<div className="overflow-x-auto">
				<div
					className="min-w-full"
					style={{
						display: 'grid',
						gridTemplateColumns: `max-content 1fr 1fr 3fr`
					}}
				>
					{table.getHeaderGroups().map((headerGroup) =>
						headerGroup.headers.map((header) => {
							const className = header.column.columnDef.meta?.className;
							return (
								<div
									key={header.id}
									className={cn(
										'border-b flex items-center border-r border-b-border-primary text-left text-[0.6875rem] font-semibold leading-[0.875rem] px-2 py-1 h-9 bg-primary-wash',
										className
									)}
								>
									{header.isPlaceholder
										? null
										: flexRender(
												header.column.columnDef.header,
												header.getContext()
										  )}
								</div>
							);
						})
					)}
					{table.getRowModel().rows.map((row) =>
						row.getVisibleCells().map((cell) => {
							const className = cell.column.columnDef.meta?.className;
							return (
								<div
									key={cell.id}
									className={cn(
										'border-b border-r border-border-primary text-[0.625rem] font-semibold leading-[1.125rem] px-2 py-1',
										className
									)}
								>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</div>
							);
						})
					)}
				</div>
			</div>
		</div>
	);
}

function RunReportLoading() {
	return (
		<div className="h-screen grid place-items-center">
			<Spinner />
		</div>
	);
}

function RunReportError(props: { error: unknown }) {
	return <BublikErrorState error={props.error} />;
}

function RunReportEmpty() {
	return (
		<BublikEmptyState
			title="No data"
			description="Run report content is empty"
		/>
	);
}

interface RunReportContentListProps {
	blocks: TestBlock[];
}

function RunReportContentList(props: RunReportContentListProps) {
	return (
		<ul className="flex flex-col gap-8">
			{props.blocks.map((block) => (
				<li key={block.id} className="relative">
					{/* LEVEL 1 */}
					<div className="absolute left-0 top-0 w-1 h-full bg-indigo-300 rounded-tl-md" />
					<RunReportContentItem key={block.id} block={block} />
				</li>
			))}
		</ul>
	);
}

interface RunReportContentItemProps {
	block: TestBlock;
}

function RunReportContentItem({ block }: RunReportContentItemProps) {
	const ref = useRef<HTMLDivElement>(null);
	const [enablePairGainColumns, toggleEnablePairGainColumns] =
		useEnablePairGainColumns();

	const args = useMemo(
		() =>
			Object.entries(block.common_args).map(([name, value]) => ({
				name,
				value: value.toString(),
				className: 'bg-badge-1'
			})),
		[block.common_args]
	);

	const [params] = useSearchParams();
	const [offsetTop, setOffsetTop] = useState(0);

	const handleRef = useCallback((node: HTMLDivElement) => {
		setOffsetTop(node?.clientHeight ?? 0);
	}, []);

	return (
		<div
			id={encodeURIComponent(block.id)}
			className="flex flex-col bg-white rounded pl-1"
		>
			<div
				className={cn('sticky top-0 bg-white z-[10] rounded-t')}
				ref={handleRef}
			>
				{/* LEVEL 1 */}
				<CardHeader
					label={
						<LinkWithProject
							className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem] hover:underline"
							to={{
								search: params.toString(),
								hash: encodeURIComponent(block.id)
							}}
						>
							{block.label}
						</LinkWithProject>
					}
					ref={ref}
				>
					<div className="flex items-center gap-2">
						<Tooltip
							content={
								enablePairGainColumns
									? 'Show columns in original order'
									: 'Place gain columns next to their base columns'
							}
						>
							<ButtonTw
								variant={enablePairGainColumns ? 'primary' : 'secondary'}
								size="xss"
								onClick={() => toggleEnablePairGainColumns()}
							>
								<Icon name="Aggregation" size={20} className="mr-1.5" />
								<span>
									{enablePairGainColumns ? 'Unpair' : 'Pair'} Gain Columns
								</span>
							</ButtonTw>
						</Tooltip>
					</div>
				</CardHeader>
				<div className="p-4">
					<RunReportArgs label="Common Arguments" items={args} />
				</div>
			</div>
			<RunReportTestBlock
				enableChartView={block.enable_chart_view}
				enableTableView={block.enable_table_view}
				argsValBlocks={block.content}
				offsetTop={offsetTop}
			/>
		</div>
	);
}

export { RunReport, RunReportError, RunReportEmpty, RunReportLoading };
