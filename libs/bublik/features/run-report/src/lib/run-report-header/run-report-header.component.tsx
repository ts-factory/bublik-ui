/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { Link } from 'react-router-dom';
import { Badge, ButtonTw, CardHeader, Icon } from '@/shared/tailwind-ui';
import { BranchBlock, RevisionBlock } from '../run-report.types';

interface RunReportHeaderProps {
	label: string;
	runUrl: string;
	sourceUrl: string;
	branches: BranchBlock[];
	revisions: RevisionBlock[];
}

function RunReportHeader(props: RunReportHeaderProps) {
	const { label, runUrl, sourceUrl, branches, revisions } = props;

	return (
		<div className="flex flex-col bg-white rounded">
			<CardHeader label={label}>
				<div className="flex items-center gap-2">
					<ButtonTw asChild variant="secondary" size="xss">
						<a href={sourceUrl} target="_blank">
							<Icon name="BoxArrowRight" className="mr-1.5" />
							Source
						</a>
					</ButtonTw>
					<ButtonTw asChild variant="secondary" size="xss">
						<Link to={runUrl}>
							<Icon name="BoxArrowRight" className="mr-1.5" />
							Run
						</Link>
					</ButtonTw>
				</div>
			</CardHeader>
			<div className="p-4 flex flex-col gap-2">
				<BranchesBlockList blocks={branches} />
				<RevisionsBlockList revisions={revisions} />
			</div>
		</div>
	);
}

type Item = {
	name: string;
	value: string;
	url?: string;
	className?: string;
};

interface ListProps {
	label: string;
	items: Item[];
}

function List(props: ListProps) {
	return (
		<div className="grid items-center grid-cols-[minmax(80px,_max-content)_48px_1fr]">
			<span className="text-text-menu text-[0.6875rem] font-medium leading-[0.875rem] col-end-2 col-start-1">
				{props.label}
			</span>
			<ul className="col-start-3 flex items-center gap-2 flex-wrap">
				{props.items.map((item) => (
					<Badge key={`${item.name}_${item.value}`} className={item.className}>
						<span className="text-[0.625rem] font-medium leading-[1.125rem]">
							{item.name}: {item.value}
						</span>
					</Badge>
				))}
			</ul>
		</div>
	);
}

interface BranchesBlockListProps {
	blocks: BranchBlock[];
}

function BranchesBlockList({ blocks }: BranchesBlockListProps) {
	return blocks.map((b) => (
		<BranchesBlockItem
			key={b.id}
			label={b.label}
			items={b.content.map((item) => ({ ...item, className: 'bg-badge-16' }))}
		/>
	));
}

interface BranchesBlockItemProps {
	label: string;
	items: { name: string; value: string }[];
}

function BranchesBlockItem({ items, label }: BranchesBlockItemProps) {
	return <List label={label} items={items} />;
}

interface RevisionsBlockListProps {
	revisions: RevisionBlock[];
}

function RevisionsBlockList(props: RevisionsBlockListProps) {
	return props.revisions.map((r) => (
		<RevisionsBlockItem key={r.id} label={r.label} items={r.content} />
	));
}

interface RevisionsBlockItemProps {
	label: string;
	items: { name: string; value: string; url?: string }[];
}

function RevisionsBlockItem(props: RevisionsBlockItemProps) {
	return (
		<List
			label={props.label}
			items={props.items.map((item) => ({ ...item, className: 'bg-badge-2' }))}
		/>
	);
}

export { RunReportHeader, List };
