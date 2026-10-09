/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ReactNode, RefObject } from 'react';
import type { Table } from '@tanstack/react-table';

import {
	ButtonTw,
	DataTableFacetedFilter,
	Icon,
	Pagination,
	Skeleton,
	Tooltip
} from '@/shared/tailwind-ui';
import type { IssueCategory, IssueState } from '@/shared/types';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';

import {
	ClassificationFooter,
	ClassificationRange,
	ClassificationSearch,
	ClassificationTable,
	ClassificationToolbar,
	ClassificationToolbarSeparator
} from '../classification-table/classification-table.component';
import {
	facetControls,
	type FacetOption
} from '../classification-table/classification-table.utils';
import {
	CategoryBadge,
	IssueRulesStateBadge,
	IssueStateBadge
} from '../classification/classification-badges.component';
import type { IssueRulesState } from '../classification/classification.types';
import { withFacetBadges } from '../classification/facet-badges.component';
import { ClassificationColumnsPicker } from '../classification-table/columns-picker.component';
import { ProjectGroupHeader } from '../classification-table/project-group-header.component';
import { NewIssueButton } from '../issue-form/issue-drawer.container';
import { COLUMN_ID, PINNED_COLUMNS } from './issues-table.constants';
import type { IssueTableRow } from './issues-table.types';

export function IssuesTableLoading() {
	return (
		<div className="flex flex-col gap-1 p-2">
			{Array.from({ length: 10 }, () => 0).map((_, idx) => (
				<Skeleton key={idx} className="h-12 rounded-md" />
			))}
		</div>
	);
}

export function IssuesTableError({ error }: { error: unknown }) {
	return <BublikErrorState error={error} className="h-full" />;
}

export interface IssuesTableEmptyProps {
	scopeLabel: string;
	children?: ReactNode;
}

export function IssuesTableEmpty({
	scopeLabel,
	children
}: IssuesTableEmptyProps) {
	return (
		<BublikEmptyState
			title="No issues"
			description={`No issues found in ${scopeLabel}. Record one here, or classify a failing result and one is recorded for you.`}
			className="h-full"
		>
			{children}
		</BublikEmptyState>
	);
}

export interface IssuesTableViewProps {
	table: Table<IssueTableRow>;
	scrollRef: RefObject<HTMLDivElement>;
	isScrollable: boolean;
	columnOrder: string[];
	onColumnOrderChange: (order: string[]) => void;
	search: string;
	onSearchChange: (value: string) => void;
	stateOptions: FacetOption[];
	rulesOptions: FacetOption[];
	categoryOptions: FacetOption[];
	hasFilters: boolean;
	onResetFilters: () => void;
	toolbarActions?: ReactNode;
	totalCount: number;
}

export function IssuesTableView({
	table,
	scrollRef,
	isScrollable,
	columnOrder,
	onColumnOrderChange,
	search,
	onSearchChange,
	stateOptions,
	rulesOptions,
	categoryOptions,
	hasFilters,
	onResetFilters,
	toolbarActions,
	totalCount
}: IssuesTableViewProps) {
	const facets = facetControls(table);

	const { pagination } = table.getState();
	const visibleRows = table.getRowModel().rows;

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
				<Tooltip content="An issue is the cause identity — what is wrong. Its rules decide which results get stamped with it, and whether those results still count as unexpected.">
					<span className="text-[0.75rem] font-semibold leading-[0.875rem] text-text-primary">
						Issues
					</span>
				</Tooltip>
				<ClassificationToolbarSeparator />
				<ClassificationSearch
					value={search}
					onChange={onSearchChange}
					placeholder="Search title, description or key"
					testId="issues-search"
					className="min-w-[240px]"
				/>
				<DataTableFacetedFilter
					title="State"
					size="xss"
					options={withFacetBadges(stateOptions, (state: IssueState) => (
						<IssueStateBadge state={state} />
					))}
					value={facets.values(COLUMN_ID.STATE)}
					onChange={(values) => facets.set(COLUMN_ID.STATE, values)}
					disabled={!stateOptions.length}
				/>
				<DataTableFacetedFilter
					title="Category"
					size="xss"
					options={withFacetBadges(
						categoryOptions,
						(category: IssueCategory) => (
							<CategoryBadge category={category} />
						)
					)}
					value={facets.values(COLUMN_ID.CATEGORIES)}
					onChange={(values) => facets.set(COLUMN_ID.CATEGORIES, values)}
					disabled={!categoryOptions.length}
				/>
				<DataTableFacetedFilter
					title="Rules"
					size="xss"
					options={withFacetBadges(
						rulesOptions,
						(rulesState: IssueRulesState) => (
							<IssueRulesStateBadge rulesState={rulesState} />
						)
					)}
					value={facets.values(COLUMN_ID.RULES)}
					onChange={(values) => facets.set(COLUMN_ID.RULES, values)}
					disabled={!rulesOptions.length}
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
						data-testid="issues-reset-filters"
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
					<ClassificationColumnsPicker
						table={table}
						columnOrder={columnOrder}
						onColumnOrderChange={onColumnOrderChange}
					/>
				</div>
			</ClassificationToolbar>

			<div ref={scrollRef} className="flex-1 min-h-0 overflow-auto bg-bg-body">
				{visibleRows.length === 0 ? (
					<BublikEmptyState
						title="No matching issues"
						description="No issue matches the current filters."
						className="h-64"
					/>
				) : (
					<ClassificationTable
						table={table}
						stickyHeader
						endGutter
						gutterBefore={PINNED_COLUMNS.last}
						scrollRef={scrollRef}
						renderGroupHeader={(row) => {
							const first = row.subRows[0]?.original;

							return (
								<ProjectGroupHeader
									name={first?.projectName ?? `Project #${row.groupingValue}`}
									count={row.subRows.length}
									noun="issue"
								>
									<NewIssueButton
										projectId={Number(row.groupingValue)}
										lockProject
									/>
								</ProjectGroupHeader>
							);
						}}
						testId="issues-table"
						getRowAttributes={(row) => ({
							'data-testid': 'issue-row',
							'data-issue-id': row.original.id,
							'data-issue-state': row.original.state
						})}
					/>
				)}
			</div>

			<ClassificationFooter isScrollable={isScrollable}>
				<ClassificationRange
					matchedCount={totalCount}
					pageIndex={pagination.pageIndex}
					pageSize={pagination.pageSize}
					noun="issue"
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
