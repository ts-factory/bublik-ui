/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	bool01,
	defineSearch,
	num,
	repeated,
	type InferSearch
} from '@/router';

/**
 * `/runs/$runId/report`. `config` is required: the page renders
 * its empty state without it. Anchors live in the hash, not the search.
 */
const runReportSearch = defineSearch(
	{
		config: num(),
		isFullMode: bool01(),
		'selected-records': repeated(),
		'stacked-drawer': bool01()
	},
	{ isFullMode: true, 'selected-records': [], 'stacked-drawer': false }
);

type RunReportSearch = InferSearch<typeof runReportSearch>;

/**
 * The collapsible blocks of the report each toggle their own key, named by
 * the block id (`arg-val-block-…`, `test-block-…`), as `1`/`0`. They cannot
 * be declared ahead of time, so they pass through the schema as raw strings
 * and are read through this helper; `undefined` is "not toggled", and the
 * default then depends on the block type.
 */
const blockToggle = bool01();

function isBlockOpen(
	search: Record<string, unknown>,
	blockId: string
): boolean | undefined {
	return blockToggle.parse(search[blockId]);
}

export { isBlockOpen, runReportSearch };
export type { RunReportSearch };
