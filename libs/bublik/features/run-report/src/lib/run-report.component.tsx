/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { useMemo } from 'react';

import {
	BranchBlock,
	ReportRoot,
	RevisionBlock,
	TestBlock
} from './run-report.types';
import { RunReportHeader } from './run-report-header';
import { RunReportTestBlock } from './run-report-test';

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

export { RunReport };
