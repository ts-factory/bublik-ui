/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type {
	ColumnFiltersState,
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

/** Per-row result-table state, keyed by row id (`RowState` in the run lib). */
interface RunRowState {
	rowId: string;
	requests?: Record<string, unknown>;
	referenceDiffRowId?: string;
	showToolbar?: boolean;
}

/**
 * The run table's keys, shared by `/runs/$runId` and `/multiple`.
 * Every table state is lz-string compressed JSON except `columnOrder`, which
 * is plain JSON. A legacy plain-JSON `expanded` is read as is and written
 * back compressed on the next write. `columnFilters` is validated against the
 * result table's own zod schema inside the run lib, which also migrates its
 * legacy shape, so it is typed but not validated here.
 *
 * No static defaults: the first row is expanded by default and the column
 * visibility and order fall back to localStorage, both data the page owns.
 */
const RUN_SHAPE = {
	expanded: compressedJson<Record<string, boolean>>(),
	sorting: compressedJson<SortingState>(),
	globalFilter: compressedJson<string[]>(),
	rowState: compressedJson<Record<string, RunRowState>>(),
	visibility: compressedJson<VisibilityState>(),
	columnFilters: compressedJson<Record<string, ColumnFiltersState>>(),
	columnOrder: json<string[]>(),
	globalRequirements: repeated(),
	targetIterationId: num(),
	resultFilter: str()
};

const runSearch = defineSearch(RUN_SHAPE);

type RunSearch = InferSearch<typeof runSearch>;

export { RUN_SHAPE, runSearch };
export type { RunRowState, RunSearch };
