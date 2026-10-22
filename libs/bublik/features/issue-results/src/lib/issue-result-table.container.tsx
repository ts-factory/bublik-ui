/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import {
	ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import type { OnChangeFn, PaginationState, Row } from '@tanstack/react-table';
import { useQueryParams } from 'use-query-params';

import {
	ClassificationFooter,
	ClassificationRange,
	ClassificationToolbar,
	ClassificationToolbarSeparator,
	PageParam,
	ResultSelectionProvider,
	createPageSizeParam,
	useSubRowPin
} from '@/bublik/features/result-classification';
import {
	GlobalRequirementsProvider,
	ResultTable,
	ResultTableError,
	ResultTableLoading,
	ResultTableToolbar,
	RunRowStateContextProvider,
	useResultTableFilters,
	useRunTableRowState,
	type RowStateContextType,
	type RunRowState
} from '@/bublik/features/run';
import { BublikEmptyState } from '@/bublik/features/ui-state';
import { useIsScrollbarVisible } from '@/shared/hooks';
import {
	useGetIssueResultsFacetsQuery,
	useGetIssueResultsQuery,
	useGetRunIssueResultsQuery
} from '@/services/bublik-api';
import { cn, Pagination } from '@/shared/tailwind-ui';
import type { RunDataResults } from '@/shared/types';

const NO_RESULTS: RunDataResults[] = [];

export interface ResultTableHostProps {
	children: ReactNode;
}

/**
 * What the run page's result table needs around it to live elsewhere: the
 * requirements filter the rows share, the per-table state (the reference
 * row) the run table keeps per row, and the selection of results to classify
 * in bulk, with its bar. All live for the page, as they do on the run page;
 * the filters themselves are in the URL.
 */
export function ResultTableHost({ children }: ResultTableHostProps) {
	const rowStateContext = useState<RunRowState>({}) as RowStateContextType;

	return (
		<GlobalRequirementsProvider>
			<RunRowStateContextProvider value={rowStateContext}>
				{/* Raised over the footer that pages the results, which the run
				    page's tables do not have. */}
				<ResultSelectionProvider raised>{children}</ResultSelectionProvider>
			</RunRowStateContextProvider>
		</GlobalRequirementsProvider>
	);
}

/**
 * The result table keys its filters and reference row by the run table row
 * it hangs under; a hosted table picks its own key.
 */
function useResultTableRowState(rowId: string) {
	const { rowState: rowStates, updateRowState } = useRunTableRowState();
	const rowState = rowStates[rowId];

	const onRowClick = useCallback(
		(row: Row<RunDataResults>) =>
			updateRowState({
				...rowState,
				rowId,
				referenceDiffRowId:
					rowState?.referenceDiffRowId === row.id ? undefined : row.id
			}),
		[updateRowState, rowId, rowState]
	);

	return { rowState, onRowClick };
}

export interface RunIssueResultTableProps {
	runId: number | string;
	issueId: number;
	projectId?: number;
}

/**
 * The results an issue stamped in one run, under the issue's row of the
 * run-issues table, shown as the run page shows a test's results: the same
 * columns, chips and filter bar, filtered in the browser since one
 * run's results arrive whole. The rows span the run's tests, so the table
 * leads with the test; each row also links to its result on the run page,
 * as the issue page's rows do.
 *
 * The issue's row stays pinned under the run-issues table's header while
 * these rows scroll, so the column header pins beneath that row, in the
 * issues table's scroller; both come from the row.
 */
export function RunIssueResultTable({
	runId,
	issueId,
	projectId
}: RunIssueResultTableProps) {
	const rowId = `run-${runId}-issue-${issueId}`;
	const pin = useSubRowPin();
	const { rowState, onRowClick } = useResultTableRowState(rowId);

	const { data, isFetching, isError, error } = useGetRunIssueResultsQuery(
		projectId !== undefined ? { runId, issueId, projectId } : skipToken
	);

	function renderBody() {
		if (isError) return <ResultTableError error={error} />;

		if (!data) return <ResultTableLoading rowCount={3} />;

		if (!data.length) {
			return <div className="px-4 py-3 text-sm text-text-menu">No results</div>;
		}

		return (
			<ResultTable
				rowId={rowId}
				data={data}
				showLinkToRun
				showTest
				height={0}
				stickyTop={pin?.top ?? 0}
				scrollRef={pin?.scrollRef}
				// The issue's row above draws no bottom edge, and a border on the
				// wrapper would scroll away under the pinned bar.
				toolbarClassName="border-t"
				rowState={rowState}
				onRowClick={onRowClick}
				isFetching={isFetching}
			/>
		);
	}

	return (
		<div
			// The table's bar brings its own top edge; the other states need one.
			className={cn(!data?.length && 'border-t border-border-primary')}
			data-testid="issue-results"
		>
			{renderBody()}
		</div>
	);
}

const DEFAULT_PAGE_SIZE = 25;

// The page the server cuts; its codecs are the rules table's, so the URL
// reads the same on both pages.
const PAGE_PARAMS = {
	page: PageParam,
	pageSize: createPageSizeParam(DEFAULT_PAGE_SIZE)
};

function usePagination() {
	const [params, setParams] = useQueryParams(PAGE_PARAMS);

	const pagination = useMemo<PaginationState>(
		() => ({ pageIndex: params.page - 1, pageSize: params.pageSize }),
		[params.page, params.pageSize]
	);

	const onPaginationChange = useCallback<OnChangeFn<PaginationState>>(
		(updater) => {
			const next =
				typeof updater === 'function' ? updater(pagination) : updater;

			setParams(
				{ page: next.pageIndex + 1, pageSize: next.pageSize },
				'replaceIn'
			);
		},
		[pagination, setParams]
	);

	const goToPage = useCallback(
		(page: number) => setParams({ page }, 'replaceIn'),
		[setParams]
	);

	// A new size changes what page 1 holds, so start over from there.
	const setPageSize = useCallback(
		(pageSize: number) => setParams({ page: 1, pageSize }, 'replaceIn'),
		[setParams]
	);

	return { pagination, onPaginationChange, goToPage, setPageSize };
}

export interface IssueResultsCardProps {
	issueId: number;
	projectId?: number;
}

/**
 * The run page's result table, fed one page of the results stamped under an
 * issue, across runs. The server narrows and pages them: an issue can stamp
 * thousands of results, so unlike one test's results in one run they are not
 * fetched whole. The filter bar still reads and writes the table's own URL
 * state; its selections go to the server, and its options come back from it,
 * over every result of the issue rather than the page on screen.
 *
 * Laid out as the issues and rules pages are: the rows scroll inside the
 * card between a bar above, holding the heading and the filters, and a
 * footer below, holding the count and the pager. The column header pins to
 * the top of that scroller.
 */
export function IssueResultsCard({
	issueId,
	projectId
}: IssueResultsCardProps) {
	const rowId = `issue-${issueId}`;
	const { rowState, onRowClick } = useResultTableRowState(rowId);
	const {
		pagination,
		onPaginationChange,
		goToPage: goToPageInUrl,
		setPageSize: setPageSizeInUrl
	} = usePagination();
	const [scrollRef, isScrollable] = useIsScrollbarVisible<HTMLDivElement>();

	// A new page starts from its top, as the other classification tables do.
	const scrollToTop = useCallback(
		() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }),
		[scrollRef]
	);
	const goToPage = useCallback(
		(page: number) => {
			goToPageInUrl(page);
			scrollToTop();
		},
		[goToPageInUrl, scrollToTop]
	);
	const setPageSize = useCallback(
		(pageSize: number) => {
			setPageSizeInUrl(pageSize);
			scrollToTop();
		},
		[setPageSizeInUrl, scrollToTop]
	);

	// The page's rows are needed only for the filter state's shape; the
	// options come from the facets, so an empty page offers everything.
	const { data: facets } = useGetIssueResultsFacetsQuery({ issueId });
	const filters = useResultTableFilters(rowId, NO_RESULTS, facets);
	const {
		resultsFilter,
		resultPropertiesFilter,
		verdictsFilter,
		categoriesFilter,
		classificationsFilter,
		artifactsFilter,
		parametersFilter,
		requirementsFilter
	} = filters;

	const { data, isFetching, isError, error } = useGetIssueResultsQuery({
		issueId,
		page: pagination.pageIndex + 1,
		pageSize: pagination.pageSize,
		results: resultsFilter,
		resultProperties: resultPropertiesFilter,
		categories: categoriesFilter,
		classifications: classificationsFilter,
		verdicts: verdictsFilter,
		artifacts: artifactsFilter,
		parameters: parametersFilter,
		requirements: requirementsFilter
	});

	// A changed filter changes what page 1 holds, as the other classification
	// tables treat it; a shared link's page is kept on arrival.
	const filterKey = JSON.stringify([
		resultsFilter,
		resultPropertiesFilter,
		verdictsFilter,
		categoriesFilter,
		classificationsFilter,
		artifactsFilter,
		parametersFilter,
		requirementsFilter
	]);
	const lastFilterKey = useRef(filterKey);
	useEffect(() => {
		if (lastFilterKey.current === filterKey) return;
		lastFilterKey.current = filterKey;
		goToPage(1);
	}, [filterKey, goToPage]);

	const results = data?.results ?? NO_RESULTS;
	const matchedCount = data?.pagination.count ?? 0;
	const pageCount = Math.max(Math.ceil(matchedCount / pagination.pageSize), 1);
	const isNarrowed = Boolean(
		resultsFilter.length ||
			resultPropertiesFilter.length ||
			verdictsFilter.length ||
			categoriesFilter.length ||
			classificationsFilter.length ||
			artifactsFilter.length ||
			parametersFilter.length ||
			requirementsFilter.length
	);

	function renderBody() {
		if (isError) return <ResultTableError error={error} />;

		if (!data && isFetching) return <ResultTableLoading rowCount={5} />;

		if (!results.length) {
			return isNarrowed ? (
				<BublikEmptyState
					title="No matching results"
					description="No result stamped under this issue matches the current filters."
					className="h-64"
				/>
			) : (
				<BublikEmptyState
					title="No results"
					description="Nothing is classified under this issue yet. Classify a failing result against it, or write a rule and apply it to a run."
					className="h-64"
				/>
			);
		}

		return (
			<ResultTable
				rowId={rowId}
				data={results}
				showLinkToRun
				showTest
				height={0}
				stickyTop={0}
				scrollRef={scrollRef}
				toolbar="external"
				manualFiltering
				pageCount={pageCount}
				pagination={pagination}
				onPaginationChange={onPaginationChange}
				rowState={rowState}
				onRowClick={onRowClick}
				isFetching={isFetching}
			/>
		);
	}

	return (
		<div className="flex flex-col flex-1 min-h-0 bg-bg-primary rounded">
			<ClassificationToolbar breakpoint="lg">
				<span className="text-[0.75rem] font-semibold leading-[0.875rem] text-text-primary">
					Results
				</span>
				<ClassificationToolbarSeparator />
				<ResultTableToolbar
					rowId={rowId}
					data={NO_RESULTS}
					facets={facets}
					results={results}
					className="min-w-0 flex-1"
				/>
			</ClassificationToolbar>
			<div
				ref={scrollRef}
				className="flex-1 min-h-0 overflow-auto"
				data-testid="issue-results-table"
				// The rows and the footer lag a filter or page change until the
				// server answers; this says when they are current.
				data-fetching={isFetching}
			>
				{renderBody()}
			</div>
			<ClassificationFooter isScrollable={isScrollable}>
				<ClassificationRange
					matchedCount={matchedCount}
					pageIndex={pagination.pageIndex}
					pageSize={pagination.pageSize}
					noun="result"
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
