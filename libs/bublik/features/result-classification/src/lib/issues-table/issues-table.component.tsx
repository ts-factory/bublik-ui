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
import { COLUMN_ID } from './issues-table.constants';
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
	search: string;
	onSearchChange: (value: string) => void;
	stateOptions: FacetOption[];
	rulesOptions: FacetOption[];
	categoryOptions: FacetOption[];
	projectOptions: FacetOption[];
	hasFilters: boolean;
	onResetFilters: () => void;
	toolbarActions?: ReactNode;
	totalCount: number;
}

export function IssuesTableView({
	table,
	scrollRef,
	isScrollable,
	search,
	onSearchChange,
	stateOptions,
	rulesOptions,
	categoryOptions,
	projectOptions,
	hasFilters,
	onResetFilters,
	toolbarActions,
	totalCount
}: IssuesTableViewProps) {
	const facets = facetControls(table);

	const { pagination } = table.getState();
	const visibleRows = table.getRowModel().rows;
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
					title="Project"
					size="xss"
					options={projectOptions}
					value={facets.values(COLUMN_ID.PROJECT)}
					onChange={(values) => facets.set(COLUMN_ID.PROJECT, values)}
					disabled={!projectOptions.length}
				/>
				<DataTableFacetedFilter
					title="State"
					size="xss"
					options={stateOptions}
					value={facets.values(COLUMN_ID.STATE)}
					onChange={(values) => facets.set(COLUMN_ID.STATE, values)}
					disabled={!stateOptions.length}
				/>
				<DataTableFacetedFilter
					title="Category"
					size="xss"
					options={categoryOptions}
					value={facets.values(COLUMN_ID.CATEGORIES)}
					onChange={(values) => facets.set(COLUMN_ID.CATEGORIES, values)}
					disabled={!categoryOptions.length}
				/>
				<DataTableFacetedFilter
					title="Rules"
					size="xss"
					options={rulesOptions}
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
					<ColumnsVisibility
						items={columnVisibilityItems(table)}
						onColumnToggle={(id, checked) =>
							table.getColumn(id)?.toggleVisibility(checked)
						}
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
						scrollRef={scrollRef}
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
					matchedCount={matchedCount}
					totalCount={matchedCount}
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
