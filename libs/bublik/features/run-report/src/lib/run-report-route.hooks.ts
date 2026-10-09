/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/**
 * The report page's URL, read and written through the typed API
 * of its route, `apps/bublik/src/routes/_app/runs/$runId.report.tsx`, whose
 * schema is `runReportSearch` (`routes/-search/run-report.search.ts`). A lib
 * cannot import the app, so the schema's defaults are applied here, at read
 * time, and the dynamic block keys are read with the same `bool01()` codec.
 */
import { useCallback, useEffect } from 'react';
import { getRouteApi } from '@tanstack/react-router';

import { bool01, useRenderedLocation, useSearchWriter } from '@/router';

import { scrollToReportItem } from './run-report-navigation.utils';

const RUN_REPORT_ROUTE_ID = '/_app/runs/$runId/report';

const runReportRoute = getRouteApi(RUN_REPORT_ROUTE_ID);

/** Nothing selected: one instance, so a selector keeps returning the same value. */
const NO_SELECTED_RECORDS: string[] = [];

/** `1` open, `0` collapsed; anything else is the block type's default. */
const blockToggle = bool01();

/** The run of the report on screen. */
function useRunReportRunId(): number {
	return runReportRoute.useParams({ select: (params) => params.runId });
}

/** `config`: the report config the page renders, `undefined` when absent or not a number. */
function useRunReportConfigId(): number | undefined {
	return runReportRoute.useSearch({ select: (search) => search.config });
}

/** `isFullMode` (full run details unless `0`), written as a replace that merges, as `useQueryParam` did. */
function useRunReportFullMode(): [boolean, (isFullMode: boolean) => void] {
	const isFullMode = runReportRoute.useSearch({
		select: (search) => search.isFullMode ?? true
	});
	const writeSearch = useSearchWriter();

	const setIsFullMode = useCallback(
		(value: boolean) => writeSearch({ isFullMode: value }),
		[writeSearch]
	);

	return [isFullMode, setIsFullMode];
}

interface RunReportStackedSearch {
	/** `selected-records`, one key per record id. */
	selectedIds: string[];
	/** `stacked-drawer`, closed unless `1`. */
	isStackedOpen: boolean;
	setSelectedIds: (ids: string[]) => void;
	setIsStackedOpen: (open: boolean) => void;
}

/** The stacked-chart selection and drawer, each written as a replace that merges. */
function useRunReportStackedSearch(): RunReportStackedSearch {
	const selectedIds = runReportRoute.useSearch({
		select: (search) => search['selected-records'] ?? NO_SELECTED_RECORDS
	});
	const isStackedOpen = runReportRoute.useSearch({
		select: (search) => search['stacked-drawer'] ?? false
	});
	const writeSearch = useSearchWriter();

	const setSelectedIds = useCallback(
		(ids: string[]) => writeSearch({ 'selected-records': ids }),
		[writeSearch]
	);
	const setIsStackedOpen = useCallback(
		(open: boolean) => writeSearch({ 'stacked-drawer': open }),
		[writeSearch]
	);

	return { selectedIds, isStackedOpen, setSelectedIds, setIsStackedOpen };
}

/**
 * Whether a table of contents block is open: its own key, named by the block
 * id, which no schema can declare ahead of time; it passes through the route
 * as a raw string and is written as one.
 */
function useRunReportBlockOpen(
	blockId: string,
	openByDefault: boolean
): [boolean, (open: boolean) => void] {
	const open = runReportRoute.useSearch({
		select: (search) =>
			blockToggle.parse((search as Record<string, unknown>)[blockId]) ??
			openByDefault
	});
	const writeSearch = useSearchWriter();

	const setOpen = useCallback(
		(value: boolean) =>
			writeSearch({ [blockId]: blockToggle.serialize(value) }),
		[writeSearch, blockId]
	);

	return [open, setOpen];
}

/**
 * Pushes the report at `hash` (already encoded) with the current search, so
 * Back returns to the previous anchor. The page scrolls to the block itself
 * (`useScrollToReportHash`): the router neither scrolls the window nor the
 * hash into view.
 */
function useRunReportAnchorNavigation(): (hash: string) => void {
	const navigate = runReportRoute.useNavigate();

	return useCallback(
		(hash: string) => {
			void navigate({
				to: '.',
				// The current search, every key kept in order.
				search: true,
				hash,
				resetScroll: false,
				hashScrollIntoView: false
			});
		},
		[navigate]
	);
}

/** The fragment of the report on screen, decoded by the router, without its `#`. */
function useRunReportHash(): string {
	return useRenderedLocation().hash;
}

/** The query string of the report on screen, with its `?`, for links that keep it. */
function useRunReportSearchString(): string {
	return useRenderedLocation().searchStr;
}

/**
 * Scrolls to the block the fragment names whenever it changes: on load (a
 * shared `#anchor` link), after an anchor navigation, and on Back/Forward.
 */
function useScrollToReportHash(): void {
	const hash = useRunReportHash();

	useEffect(() => {
		if (!hash) return;

		const animationFrame = requestAnimationFrame(() => {
			scrollToReportItem(decodeURIComponent(hash));
		});

		return () => cancelAnimationFrame(animationFrame);
	}, [hash]);
}

export {
	RUN_REPORT_ROUTE_ID,
	useRunReportAnchorNavigation,
	useRunReportBlockOpen,
	useRunReportConfigId,
	useRunReportFullMode,
	useRunReportHash,
	useRunReportRunId,
	useRunReportSearchString,
	useRunReportStackedSearch,
	useScrollToReportHash
};
export type { RunReportStackedSearch };
