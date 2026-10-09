/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type {
	ColumnFiltersState,
	ExpandedState,
	SortingState,
	VisibilityState
} from '@tanstack/react-table';

import {
	compressedJson,
	defineSearch,
	json,
	num,
	repeated,
	str,
	type InferSearch
} from '@/router';
import type { ResultTableFilter } from '@/shared/types';

/** One result table's state in `rowState`, keyed by its row id. */
interface RunTableRowState {
	rowId: string;
	requests?: Record<string, ResultTableFilter>;
	referenceDiffRowId?: string;
	showToolbar?: boolean;
}

/**
 * The run table's keys, shared by `/runs/$runId` and `/multiple`
 * and by the run feature, which reads and writes them on both (a lib cannot
 * import the app's routes, and the route files keep this out of the page
 * chunks, so it lives here). Every table state is lz-string compressed JSON
 * except `columnOrder`, which is plain JSON. A legacy plain-JSON value of a
 * compressed key is read as is and written back compressed. `columnFilters`
 * is validated against the result table's own zod schemas where it is read,
 * so it is typed but not validated here.
 *
 * No static defaults: the first row is expanded by default and the column
 * visibility and order fall back to localStorage, both data the page owns.
 */
const RUN_TABLE_SHAPE = {
	expanded: compressedJson<ExpandedState>(),
	sorting: compressedJson<SortingState>(),
	globalFilter: compressedJson<string[]>(),
	rowState: compressedJson<Record<string, RunTableRowState>>(),
	visibility: compressedJson<VisibilityState>(),
	columnFilters: compressedJson<Record<string, ColumnFiltersState>>(),
	columnOrder: json<string[]>(),
	globalRequirements: repeated(),
	targetIterationId: num(),
	resultFilter: str()
};

/** `/runs/$runId`'s search schema; `/multiple` adds its own keys to the shape. */
const runSearch = defineSearch(RUN_TABLE_SHAPE);

/** The typed search of `/runs/$runId`. */
type RunRouteSearch = InferSearch<typeof runSearch>;

export { RUN_TABLE_SHAPE, runSearch };
export type { RunRouteSearch, RunTableRowState };
