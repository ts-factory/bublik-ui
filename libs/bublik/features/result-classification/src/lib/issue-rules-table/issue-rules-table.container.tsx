/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect, useMemo } from 'react';
import {
	getCoreRowModel,
	getExpandedRowModel,
	getGroupedRowModel,
	getSortedRowModel,
	useReactTable
} from '@tanstack/react-table';

import { useIsScrollbarVisible } from '@/shared/hooks';
import {
	useGetIssueRulesFacetsQuery,
	useGetIssueRulesQuery
} from '@/services/bublik-api';

import {
	useClassificationTableState,
	useColumnOrder,
	useColumnVisibility,
	useGroupedExpanded,
	useElementWidth
} from '../classification-table/classification-table.hooks';
import { KEY } from '../classification-table/classification-table.constants';
import { RuleDetail } from './components';
import { getColumns } from './issue-rules-table.columns';
import {
	IssueRulesTableEmpty,
	IssueRulesTableError,
	IssueRulesTableLoading,
	IssueRulesTableView
} from './issue-rules-table.component';
import {
	COLUMN_ID,
	COLUMN_VISIBILITY_KEY,
	COMPACT_COLUMN_VISIBILITY,
	COMPACT_WIDTH_PX,
	DEFAULT_COLUMN_ORDER,
	DEFAULT_COLUMN_VISIBILITY,
	DEFAULT_PAGE_SIZE,
	FILTER_KEYS,
	ORDERING_BY_COLUMN_ID,
	PINNED_COLUMNS,
	REPEATED_FILTER_KEYS
} from './issue-rules-table.constants';
import { useFacetOptions } from './issue-rules-table.hooks';
import type { IssueRulesTableProps } from './issue-rules-table.types';
import { buildRows } from './issue-rules-table.utils';

const NO_GROUPING: string[] = [];
const GROUP_BY_PROJECT = [COLUMN_ID.PROJECT];

export function IssueRulesTable({
	issueId,
	projectId,
	toolbarActions
}: IssueRulesTableProps) {
	const showIssue = issueId === undefined;
	// Grouped by project on the all-rules page, one project picked or not, so
	// the headings and their New Rule buttons stay put as the picker changes.
	// One issue's rules are one project's, so that page needs no headings.
	const groupByProject = showIssue;

	const [scrollRef, isScrollable] = useIsScrollbarVisible<HTMLDivElement>();
	const [widthRef, width] = useElementWidth<HTMLDivElement>();

	// Undefined until the first measurement, which we read as "there is room":
	// the wide layout is the better guess for the frame before we know.
	const compact =
		width !== undefined &&
		width < COMPACT_WIDTH_PX[showIssue ? 'ALL_RULES' : 'ONE_ISSUE'];

	const columnDefaults = compact
		? COMPACT_COLUMN_VISIBILITY
		: DEFAULT_COLUMN_VISIBILITY;

	const [columnVisibility, setColumnVisibility] = useColumnVisibility(
		showIssue
			? COLUMN_VISIBILITY_KEY.ALL_RULES
			: COLUMN_VISIBILITY_KEY.ONE_ISSUE,
		columnDefaults,
		{ queryKey: KEY.COLUMNS }
	);
	const defaultColumnOrder = showIssue
		? DEFAULT_COLUMN_ORDER.ALL_RULES
		: DEFAULT_COLUMN_ORDER.ONE_ISSUE;
	const [columnOrder, setColumnOrder] = useColumnOrder(
		showIssue
			? COLUMN_VISIBILITY_KEY.ALL_RULES
			: COLUMN_VISIBILITY_KEY.ONE_ISSUE,
		defaultColumnOrder,
		PINNED_COLUMNS,
		{ queryKey: KEY.COLUMN_ORDER }
	);

	const {
		pagination,
		onPaginationChange,
		columnFilters,
		onColumnFiltersChange,
		sorting,
		onSortingChange,
		search,
		setSearch,
		hasFilters,
		resetFilters,
		clampPage,
		queryArgs
	} = useClassificationTableState({
		filterKeys: FILTER_KEYS,
		repeatedFilterKeys: REPEATED_FILTER_KEYS,
		searchColumnId: COLUMN_ID.ISSUE,
		defaultPageSize: DEFAULT_PAGE_SIZE,
		orderingByColumnId: ORDERING_BY_COLUMN_ID
	});

	const filterArgs = {
		projectId,
		issue: issueId,
		search: queryArgs.search,
		category: queryArgs.filters[COLUMN_ID.CATEGORY],
		expected: queryArgs.filters[COLUMN_ID.DISPOSITION],
		active: queryArgs.filters[COLUMN_ID.ACTIVE],
		issueState: queryArgs.filters[COLUMN_ID.ISSUE_STATE],
		tags: queryArgs.filters[COLUMN_ID.TAGS],
		verdicts: queryArgs.filters[COLUMN_ID.VERDICTS],
		parameters: queryArgs.filters[COLUMN_ID.PARAMETERS]
	};
	const {
		data: rulesData,
		isLoading: isRulesLoading,
		error: rulesError
	} = useGetIssueRulesQuery({
		...filterArgs,
		page: queryArgs.page,
		pageSize: queryArgs.pageSize,
		ordering: queryArgs.ordering
	});
	const { data: facets } = useGetIssueRulesFacetsQuery(filterArgs);

	const rules = useMemo(() => buildRows(rulesData?.results ?? []), [rulesData]);
	const totalCount = rulesData?.pagination.count ?? 0;
	// Detail panels, and the project groups a reader folded away.
	const [expanded, setExpanded] = useGroupedExpanded(
		COLUMN_ID.PROJECT,
		groupByProject ? rules.map((rule) => rule.project) : []
	);
	const columns = useMemo(
		() => getColumns({ showIssue, compact }),
		[showIssue, compact]
	);
	const {
		categoryOptions,
		dispositionOptions,
		activeOptions,
		issueStateOptions,
		parameterOptions,
		verdictOptions,
		tagOptions
	} = useFacetOptions(rules, facets);

	const table = useReactTable({
		data: rules,
		columns,
		state: {
			columnFilters,
			sorting,
			pagination,
			columnVisibility,
			columnOrder,
			grouping: groupByProject ? GROUP_BY_PROJECT : NO_GROUPING,
			expanded
		},
		onColumnVisibilityChange: setColumnVisibility,
		onColumnOrderChange: setColumnOrder,
		onColumnFiltersChange,
		onSortingChange,
		onPaginationChange,
		onExpandedChange: setExpanded,
		rowCount: totalCount,
		manualPagination: true,
		// Every filter, search included, is the server's: the page holds only
		// matching rules, and a second pass here could only drop some of them.
		manualFiltering: true,
		getRowId: (row) => String(row.id),
		getRowCanExpand: (row) => row.getIsGrouped() || compact,
		autoResetExpanded: false,
		getCoreRowModel: getCoreRowModel(),
		getGroupedRowModel: getGroupedRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getExpandedRowModel: getExpandedRowModel()
	});

	const pageCount = table.getPageCount();

	useEffect(() => clampPage(pageCount), [pageCount, clampPage]);

	if (isRulesLoading) return <IssueRulesTableLoading />;

	if (rulesError) return <IssueRulesTableError error={rulesError} />;

	if (!totalCount && !hasFilters && !search) {
		return (
			<IssueRulesTableEmpty showIssue={showIssue}>
				{toolbarActions}
			</IssueRulesTableEmpty>
		);
	}

	return (
		<IssueRulesTableView
			table={table}
			scrollRef={scrollRef}
			widthRef={widthRef}
			isScrollable={isScrollable}
			renderSubRow={compact ? (row) => <RuleDetail row={row} /> : undefined}
			showIssue={showIssue}
			groupByProject={groupByProject}
			columnOrder={columnOrder}
			onColumnOrderChange={setColumnOrder}
			search={search}
			onSearchChange={setSearch}
			issueStateOptions={issueStateOptions}
			categoryOptions={categoryOptions}
			dispositionOptions={dispositionOptions}
			activeOptions={activeOptions}
			parameterOptions={parameterOptions}
			verdictOptions={verdictOptions}
			tagOptions={tagOptions}
			hasFilters={hasFilters}
			onResetFilters={resetFilters}
			toolbarActions={toolbarActions}
			totalCount={totalCount}
		/>
	);
}
