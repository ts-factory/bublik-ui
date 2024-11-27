/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { ComponentProps, useCallback, useMemo, useRef, useState } from 'react';

import { useMount } from '@/shared/hooks';
import {
	Badge,
	ButtonTw,
	CardHeader,
	cn,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Icon,
	Spinner,
	toast
} from '@/shared/tailwind-ui';

import {
	NotProcessedPoint,
	ReportRoot,
	RunDetailsAPIResponse,
	TestBlock
} from '@/shared/types';
import { List, RunReportHeader } from './run-report-header';
import { RunReportTestBlock, WarningsHoverCard } from './run-report-test';
import { useLocation } from 'react-router';
import { getErrorMessage } from '@/services/bublik-api';
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable
} from '@tanstack/react-table';
import { Link, useSearchParams } from 'react-router-dom';

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
			<ul className="flex flex-col gap-2 overflow-auto">
				{contents.map((item) => (
					<li key={item.id}>
						<TableOfContentsItem item={item} />
					</li>
				))}
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
	const [open, setOpen] = useState(isOpenByDefault);
	const [params] = useSearchParams();
	const configid = params.get('config');

	function scrollToItem() {
		const elem = document.getElementById(encodeURIComponent(item.id));
		const scroller = document.getElementById('page-container');

		if (!scroller || !elem) return;

		const y = elem.getBoundingClientRect().top + scroller.clientTop - 70;

		scroller.scrollTo({ top: y, behavior: 'smooth' });
	}

	return (
		<Collapsible open={open} onOpenChange={setOpen} className="">
			<div
				className="px-4 py-1 flex items-center gap-1 text-sm"
				style={{ paddingLeft: `${depth * 12 + 16}px` }}
			>
				{item.children ? (
					<CollapsibleTrigger className="grid place-items-center p-0.5 hover:bg-primary-wash hover:text-text-primary">
						<Icon
							name="ChevronDown"
							className={cn('size-4', open ? '' : '-rotate-90')}
						/>
					</CollapsibleTrigger>
				) : (
					<div className="size-5 rounded-full" />
				)}
				<Link
					to={{
						search: `?config=${configid}`,
						hash: encodeURIComponent(item.id)
					}}
					className={cn(
						(item.type === 'test-block' || item.type === 'arg-val-block') &&
							'font-semibold'
					)}
					onClick={scrollToItem}
				>
					{item.label}
				</Link>
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

	const testBlocks = useMemo(
		() => blocks.content.filter((b) => b.type === 'test-block'),
		[blocks.content]
	);
	const location = useLocation();

	useMount(() => {
		try {
			const id = location.hash;
			const elem = document.getElementById(id.slice(1));
			const scroller = document.getElementById('page-container');

			if (!scroller || !elem) return;

			const y = elem.getBoundingClientRect().top + scroller.clientTop - 70;

			scroller.scrollTo({ top: y, behavior: 'smooth' });
		} catch (_) {
			toast.error('Failed to scroll to saved location!');
		}
	});

	return (
		<div className="flex flex-col gap-1 relative">
			<RunReportHeader label="Info" details={details} runId={runId} />
			<ReportConfigurationFrame
				warnings={blocks.warnings}
				config={blocks.config}
			/>
			<RunReportTableOfContents contents={generateTableOfContents(blocks)} />
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
					<Link to={`/admin/config?configId=${searchParams.get('config')}`}>
						<Icon name="BoxArrowRight" className="mr-1.5" />
						Config
					</Link>
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
	const { error = {} } = props;
	const { title, description, status } = getErrorMessage(error);

	return (
		<div className="grid place-items-center h-[calc(100vh-256px)]">
			<div className="flex flex-col items-center text-center">
				<Icon
					name="TriangleExclamationMark"
					size={24}
					className="text-text-unexpected"
				/>
				<h3 className="mt-2 text-sm font-medium text-gray-900">
					{status} {title}
				</h3>
				<p className="mt-1 text-sm text-gray-500">{description}</p>
			</div>
		</div>
	);
}

function RunReportEmpty() {
	return <div>Empty...</div>;
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
						<Link
							className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem] hover:underline"
							to={{
								search: params.toString(),
								hash: encodeURIComponent(block.id)
							}}
						>
							{block.label}
						</Link>
					}
					ref={ref}
				/>
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

interface RunReportCommonArgsProps {
	items: ComponentProps<typeof List>['items'];
	label: string;
}

function RunReportArgs(props: RunReportCommonArgsProps) {
	return <List label={props.label} items={props.items} />;
}

export {
	RunReport,
	RunReportArgs,
	RunReportError,
	RunReportEmpty,
	RunReportLoading
};
