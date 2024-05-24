/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { useMemo, useRef } from 'react';

import { CardHeader, cn } from '@/shared/tailwind-ui';
import { useIsSticky } from '@/shared/hooks';

import {
	BranchBlock,
	RecordEntityBlock,
	ReportRoot,
	RevisionBlock,
	TestBlock
} from './run-report.types';
import { RunReportHeader } from './run-report-header';
import { RunReportChart } from './run-report-chart';
import { RunReportTable } from './run-report-table';

interface RunReportProps {
	blocks: ReportRoot;
}

function RunReport(props: RunReportProps) {
	const {
		blocks: { title, run_source_link, run_stats_link, content }
	} = props;

	const branchBlocks = useMemo(
		() => content.filter((b) => b.type === 'branch-block') as BranchBlock[],
		[content]
	);
	const revisionsBlocks = useMemo(
		() => content.filter((b) => b.type === 'rev-block') as RevisionBlock[],
		[content]
	);
	const other = useMemo(
		() => content.filter((b) => b.type === 'test-block'),
		[content]
	) as TestBlock[];

	return (
		<>
			<RunReportHeader
				label={title}
				runUrl={run_stats_link}
				sourceUrl={run_source_link}
				branches={branchBlocks}
				revisions={revisionsBlocks}
			/>
			<RunReportContent blocks={other} />
		</>
	);
}

interface RunReportContentProps {
	blocks: TestBlock[];
}

function RunReportContent(props: RunReportContentProps) {
	return props.blocks.map((block) => (
		<RunReportTestBlock
			key={block.id}
			id={block.id}
			label={block.label}
			enableChartView={block.enable_chart_view}
			enableTableView={block.enable_table_view}
			commonArgs={block.common_args}
			measurements={block.content}
		/>
	));
}

interface RunReportTestBlockProps {
	id: string;
	label: string;
	enableChartView: boolean;
	enableTableView: boolean;
	commonArgs: Record<string, string | number>;
	measurements: RecordEntityBlock[];
}

function RunReportTestBlock(props: RunReportTestBlockProps) {
	const {
		id,
		label,
		commonArgs,
		enableChartView,
		enableTableView,
		measurements
	} = props;

	const ref = useRef<HTMLDivElement>(null);
	const { isSticky } = useIsSticky(ref);

	return (
		<div id={id} className="flex flex-col bg-white rounded">
			<CardHeader
				label={label}
				className={cn('sticky top-0 bg-white z-10 rounded-t')}
				style={
					isSticky
						? {
								boxShadow: 'rgba(0, 0, 0, 0.1) 0px 0px 15px 0px',
								borderColor: 'transparent',
								borderRadius: 0
						  }
						: undefined
				}
				ref={ref}
			/>
			<ul className="flex flex-col">
				{measurements.map((measurement) => (
					<li key={measurement.id} className="border-b">
						<RunReportEntityBlock
							label={measurement.label}
							chart={measurement.dataset_chart}
							table={measurement.dataset_table}
							enableChartView={enableChartView}
							enableTableView={enableTableView}
							xKey={measurement.axis_x_key}
							xAxisLabel={measurement.axis_x_label}
						/>
					</li>
				))}
			</ul>
		</div>
	);
}

interface RunReportEntityBlockProps
	extends Pick<RunReportTestBlockProps, 'enableChartView' | 'enableTableView'> {
	table: Array<string | number>[];
	chart: Array<string | number>[];
	xKey: string;
	xAxisLabel: string;
	label: string;
}

function RunReportEntityBlock(props: RunReportEntityBlockProps) {
	const {
		chart,
		table,
		enableChartView,
		enableTableView,
		xKey,
		xAxisLabel,
		label
	} = props;

	return (
		<div className="flex items-start gap-2">
			{enableChartView ? (
				<div className="border-r border-border-primary w-full p-4 h-full">
					<RunReportChart
						data={chart}
						xKey={xKey}
						xAxisLabel={xAxisLabel}
						label={label}
					/>
				</div>
			) : null}
			{enableTableView ? (
				<div className="w-full p-4 h-full">
					<RunReportTable data={table} />
				</div>
			) : null}
		</div>
	);
}

export { RunReport };
