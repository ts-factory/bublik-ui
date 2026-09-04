/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ReactNode, RefObject } from 'react';
import type { Table } from '@tanstack/react-table';

import {
	ButtonTw,
	ColumnsVisibility,
	DataTableFacetedFilter,
	Icon,
	Pagination,
	Skeleton,
	Tooltip
} from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';

import {
	ClassificationFooter,
	ClassificationRange,
	ClassificationSearch,
	ClassificationTable,
	ClassificationToolbar,
	ClassificationToolbarSeparator,
	columnVisibilityItems
} from '../classification-table/classification-table.component';
import {
	facetControls,
	type FacetOption
} from '../classification-table/classification-table.utils';
import { COLUMN_ID } from './issue-rules-table.constants';
import type { IssueRuleRow } from './issue-rules-table.types';

export function IssueRulesTableLoading() {
	return (
		<div className="flex flex-col gap-1 p-2">
			{Array.from({ length: 6 }, () => 0).map((_, idx) => (
				<Skeleton key={idx} className="h-10 rounded-md" />
			))}
		</div>
	);
}

export function IssueRulesTableError({ error }: { error: unknown }) {
	return <BublikErrorState error={error} className="h-[40vh]" />;
}

export interface IssueRulesTableEmptyProps {
	showIssue: boolean;
	children?: ReactNode;
}

export function IssueRulesTableEmpty({
	showIssue,
	children
}: IssueRulesTableEmptyProps) {
	return (
		<BublikEmptyState
			title="No rules"
			description={
				showIssue
					? 'No rules yet. Write one here, or classify a failing result and one is written for you.'
					: 'This issue has no rules yet. Write one here, or classify a failing result against this issue.'
			}
			className="h-[40vh]"
		>
			{children}
		</BublikEmptyState>
	);
}

export interface IssueRulesTableViewProps {
	table: Table<IssueRuleRow>;
	scrollRef: RefObject<HTMLDivElement>;
	isScrollable: boolean;
	showIssue: boolean;
	search: string;
	onSearchChange: (value: string) => void;
	projectOptions: FacetOption[];
	issueStateOptions: FacetOption[];
	categoryOptions: FacetOption[];
	dispositionOptions: FacetOption[];
	activeOptions: FacetOption[];
	parameterOptions: FacetOption[];
	verdictOptions: FacetOption[];
	tagOptions: FacetOption[];
	hasFilters: boolean;
	onResetFilters: () => void;
	toolbarActions?: ReactNode;
	totalCount: number;
}

export function IssueRulesTableView({
	table,
	scrollRef,
	isScrollable,
	showIssue,
	search,
	onSearchChange,
	projectOptions,
	issueStateOptions,
	categoryOptions,
	dispositionOptions,
	activeOptions,
	parameterOptions,
	verdictOptions,
	tagOptions,
	hasFilters,
	onResetFilters,
	toolbarActions,
	totalCount
}: IssueRulesTableViewProps) {
	const facets = facetControls(table);

	const { pagination } = table.getState();
	const rows = table.getRowModel().rows;
	const matchedCount = table.getFilteredRowModel().rows.length;

	function scrollToTop() {
		scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function goToPage(page: number) {
		table.setPageIndex(page - 1);
		scrollToTop();
	}

	function setPageSize(pageSize: number) {
		table.setPageSize(pageSize);
		scrollToTop();
	}

	return (
		<div className="flex flex-col flex-1 min-h-0">
			<ClassificationToolbar>
				<span className="text-[0.75rem] font-semibold leading-[0.875rem] text-text-primary">
					Rules
				</span>
				<ClassificationToolbarSeparator />
				<ClassificationSearch
					value={search}
					onChange={onSearchChange}
					placeholder={showIssue ? 'Search test or issue' : 'Search test'}
					testId="issue-rules-search"
					className="min-w-[220px]"
				/>
				<DataTableFacetedFilter
					title="Project"
					size="xss"
					options={projectOptions}
					value={facets.values(COLUMN_ID.PROJECT)}
					onChange={(values) => facets.set(COLUMN_ID.PROJECT, values)}
					disabled={!projectOptions.length}
				/>
				{showIssue ? (
					<DataTableFacetedFilter
						title="State"
						size="xss"
						options={issueStateOptions}
						value={facets.values(COLUMN_ID.ISSUE_STATE)}
						onChange={(values) => facets.set(COLUMN_ID.ISSUE_STATE, values)}
						disabled={!issueStateOptions.length}
					/>
				) : null}
				<DataTableFacetedFilter
					title="Category"
					size="xss"
					options={categoryOptions}
					value={facets.values(COLUMN_ID.CATEGORY)}
					onChange={(values) => facets.set(COLUMN_ID.CATEGORY, values)}
					disabled={!categoryOptions.length}
				/>
				<DataTableFacetedFilter
					title="Disposition"
					size="xss"
					options={dispositionOptions}
					value={facets.values(COLUMN_ID.DISPOSITION)}
					onChange={(values) => facets.set(COLUMN_ID.DISPOSITION, values)}
					disabled={!dispositionOptions.length}
				/>
				<DataTableFacetedFilter
					title="Rule"
					size="xss"
					options={activeOptions}
					value={facets.values(COLUMN_ID.ACTIVE)}
					onChange={(values) => facets.set(COLUMN_ID.ACTIVE, values)}
					disabled={!activeOptions.length}
				/>
				<DataTableFacetedFilter
					title="Parameters"
					size="xss"
					options={parameterOptions}
					value={facets.values(COLUMN_ID.PARAMETERS)}
					onChange={(values) => facets.set(COLUMN_ID.PARAMETERS, values)}
					disabled={!parameterOptions.length}
				/>
				<DataTableFacetedFilter
					title="Verdicts"
					size="xss"
					options={verdictOptions}
					value={facets.values(COLUMN_ID.VERDICTS)}
					onChange={(values) => facets.set(COLUMN_ID.VERDICTS, values)}
					disabled={!verdictOptions.length}
				/>
				<DataTableFacetedFilter
					title="Tags"
					size="xss"
					options={tagOptions}
					value={facets.values(COLUMN_ID.TAGS)}
					onChange={(values) => facets.set(COLUMN_ID.TAGS, values)}
					disabled={!tagOptions.length}
				/>
				<ClassificationToolbarSeparator />
				<Tooltip
					content={hasFilters ? 'Reset all filters' : 'No filters to reset'}
				>
					<ButtonTw
						variant="secondary"
						size="xss"
						disabled={!hasFilters}
						onClick={onResetFilters}
						data-testid="issue-rules-reset-filters"
					>
						<Icon name="Bin" size={18} className="mr-1.5" />
						Reset
					</ButtonTw>
				</Tooltip>
				<div className="flex items-center gap-2 ml-auto">
					{toolbarActions ? (
						<>
							{toolbarActions}
							<ClassificationToolbarSeparator />
						</>
					) : null}
					<ColumnsVisibility
						items={columnVisibilityItems(table)}
						onColumnToggle={(id, checked) =>
							table.getColumn(id)?.toggleVisibility(checked)
						}
					/>
				</div>
			</ClassificationToolbar>

			<div ref={scrollRef} className="flex-1 min-h-0 overflow-auto bg-bg-body">
				{rows.length === 0 ? (
					<BublikEmptyState
						title="No matching rules"
						description="No rule matches the current filters."
						className="h-64"
					/>
				) : (
					<ClassificationTable
						table={table}
						stickyHeader
						scrollRef={scrollRef}
						testId="issue-rules-table"
						getRowAttributes={(row) => ({
							'data-testid': 'issue-rule-row',
							'data-rule-id': row.original.id,
							'data-project-id': row.original.project,
							'data-rule-active': row.original.active ? 'true' : 'false'
						})}
					/>
				)}
			</div>

			<ClassificationFooter isScrollable={isScrollable}>
				<ClassificationRange
					matchedCount={matchedCount}
					totalCount={matchedCount}
					pageIndex={pagination.pageIndex}
					pageSize={pagination.pageSize}
					noun="rule"
				/>
				<Pagination
					className="ml-auto"
					variant="compact"
					totalCount={totalCount}
					pageSize={pagination.pageSize}
					currentPage={pagination.pageIndex + 1}
					onPageChange={goToPage}
					onPageSizeChange={setPageSize}
				/>
			</ClassificationFooter>
		</div>
	);
}
