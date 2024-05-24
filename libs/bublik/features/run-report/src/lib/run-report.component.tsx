/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { ComponentProps, useEffect, useMemo, useRef } from 'react';

import { useIsSticky, useMount } from '@/shared/hooks';
import { CardHeader, cn, toast } from '@/shared/tailwind-ui';

import {
	BranchBlock,
	ReportRoot,
	RevisionBlock,
	TestBlock
} from './run-report.types';
import { List, RunReportHeader } from './run-report-header';
import { RunReportTestBlock } from './run-report-test';
import { useLocation } from 'react-router';

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

	const location = useLocation();

	useMount(() => {
		try {
			const id = location.hash;
			const elem = document.querySelector(id);
			const scroller = document.getElementById('page-container');

			if (!scroller || !elem) return;

			const y = elem.getBoundingClientRect().top + scroller.clientTop - 70;

			scroller.scrollTo({ top: y, behavior: 'smooth' });
		} catch (_) {
			toast.error('Failed to scroll to saved location!');
		}
	});

	return (
		<>
			<RunReportHeader
				label={title}
				runUrl={run_stats_link}
				sourceUrl={run_source_link}
				branches={branchBlocks}
				revisions={revisionsBlocks}
			/>
			<RunReportContentList blocks={other} />
		</>
	);
}

interface RunReportContentListProps {
	blocks: TestBlock[];
}

function RunReportContentList(props: RunReportContentListProps) {
	return props.blocks.map((block) => (
		<RunReportContentItem key={block.id} block={block} />
	));
}

interface RunReportContentItemProps {
	block: TestBlock;
}

function RunReportContentItem({ block }: RunReportContentItemProps) {
	const ref = useRef<HTMLDivElement>(null);
	const { isSticky } = useIsSticky(ref);

	const args = useMemo(
		() =>
			Object.entries(block.common_args).map(([name, value]) => ({
				name,
				value: value.toString(),
				className: 'bg-badge-1'
			})),
		[]
	);

	const style = isSticky
		? {
				boxShadow: 'rgba(0, 0, 0, 0.1) 0px 0px 15px 0px',
				borderColor: 'transparent',
				borderRadius: 0
		  }
		: undefined;

	return (
		<div id={block.id} className="flex flex-col bg-white rounded">
			<CardHeader
				label={block.label}
				className={cn('sticky top-0 bg-white z-10 rounded-t')}
				style={style}
				ref={ref}
			/>
			<div className="p-4 border-b border-border-primary">
				<RunReportArgs label="Common Args" items={args} />
			</div>
			<RunReportTestBlock
				enableChartView={block.enable_chart_view}
				enableTableView={block.enable_table_view}
				measurements={block.content}
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

export { RunReport, RunReportArgs };
