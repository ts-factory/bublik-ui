/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ReactNode, RefObject } from 'react';
import type { Row, Table } from '@tanstack/react-table';

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
import type { RunIssueRow } from '@/shared/types';

import {
	ClassificationFooter,
	ClassificationRange,
	ClassificationSearch,
	ClassificationTable,
	ClassificationToolbar,
	ClassificationToolbarSeparator,
	columnVisibilityItems
} from '../classification-table/classification-table.component';
import { facetControls } from '../classification-table/classification-table.utils';
import type { FacetOption } from '../classification-table/classification-table.utils';
import { COLUMN_ID } from './run-issues-table.constants';

export function RunIssuesTableLoading() {
	return (
		<div className="flex flex-col gap-1 p-2">
			{Array.from({ length: 10 }, () => 0).map((_, idx) => (
				<Skeleton key={idx} className="h-10 rounded-md" />
			))}
		</div>
	);
}

export function RunIssuesTableError({ error }: { error: unknown }) {
	return <BublikErrorState error={error} className="h-full" />;
}

export function RunIssuesTableEmpty() {
	return (
		<BublikEmptyState
			title="No issues"
			description="Nothing in this run is classified yet. Classify a failing result, or apply the active rules to this run."
			className="h-full"
		/>
	);
}

export interface RunIssuesTableViewProps {
	table: Table<RunIssueRow>;
	scrollRef: RefObject<HTMLDivElement>;
	isScrollable: boolean;
	search: string;
	onSearchChange: (value: string) => void;
	stateOptions: FacetOption[];
	effectOptions: FacetOption[];
	categoryOptions: FacetOption[];
	hasFilters: boolean;
	onResetFilters: () => void;
	toolbarActions?: ReactNode;
	totalCount: number;
	renderSubRow: (row: Row<RunIssueRow>) => ReactNode;
}

export function RunIssuesTableView({
	table,
	scrollRef,
	isScrollable,
	search,
	onSearchChange,
	stateOptions,
	effectOptions,
	categoryOptions,
	hasFilters,
	onResetFilters,
	toolbarActions,
	totalCount,
	renderSubRow
}: RunIssuesTableViewProps) {
	// The same controls the row chips write through, so the dropdowns and the
	// badges are two views of one filter rather than two filters.
	const facets = facetControls(table);

	const { pagination } = table.getState();
	const rows = table.getRowModel().rows;
	const matchedCount = table.getFilteredRowModel().rows.length;

	function scrollToTop() {
		scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
	}

	// Both of these change which rows are on screen, so both return the reader
	// to the top of the list.
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
					Issues
				</span>
				<ClassificationToolbarSeparator />
				<ClassificationSearch
					value={search}
					onChange={onSearchChange}
					placeholder="Search title or key"
					testId="run-issues-search"
					className="min-w-[220px]"
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
					title="Effect On Run"
					size="xss"
					options={effectOptions}
					value={facets.values(COLUMN_ID.EFFECT)}
					onChange={(values) => facets.set(COLUMN_ID.EFFECT, values)}
					disabled={!effectOptions.length}
				/>
				<DataTableFacetedFilter
					title="Category"
					size="xss"
					options={categoryOptions}
					value={facets.values(COLUMN_ID.CATEGORIES)}
					onChange={(values) => facets.set(COLUMN_ID.CATEGORIES, values)}
					disabled={!categoryOptions.length}
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
						data-testid="run-issues-reset-filters"
					>
						<Icon name="Bin" size={18} className="mr-1.5" />
						Reset
					</ButtonTw>
				</Tooltip>
				{/* The two controls that act on the table rather than on what it is
				    showing, grouped at the trailing edge behind their own rule. */}
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

			{/* Grey, because the rows are white cards and a card needs something to
			    sit on. The toolbar and footer paint their own white. */}
			<div ref={scrollRef} className="flex-1 min-h-0 overflow-auto bg-bg-body">
				{rows.length === 0 ? (
					<BublikEmptyState
						title="No matching issues"
						description="No issue in this run matches the current filters."
						className="h-64"
					/>
				) : (
					<ClassificationTable
						table={table}
						stickyHeader
						scrollRef={scrollRef}
						testId="run-issues-table"
						getRowAttributes={(row) => ({
							'data-testid': 'run-issue-row',
							'data-issue-id': row.original.issue_id,
							'data-issue-state': row.original.state
						})}
						renderSubRow={renderSubRow}
					/>
				)}
			</div>

			<ClassificationFooter isScrollable={isScrollable}>
				<ClassificationRange
					matchedCount={matchedCount}
					totalCount={totalCount}
					pageIndex={pagination.pageIndex}
					pageSize={pagination.pageSize}
					noun="issue"
				/>
				<Pagination
					className="ml-auto"
					variant="compact"
					totalCount={matchedCount}
					pageSize={pagination.pageSize}
					currentPage={pagination.pageIndex + 1}
					onPageChange={goToPage}
					onPageSizeChange={setPageSize}
				/>
			</ClassificationFooter>
		</div>
	);
}
